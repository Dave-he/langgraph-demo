// 1. 导入核心依赖
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { StateGraph, END, START } from "@langchain/langgraph";
import {
  HumanMessage,
  AIMessage,
  BaseMessage,
} from "@langchain/core/messages";
import * as readline from "readline";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

// 2. 初始化本地 Ollama 模型
const llm = new ChatOllama({
  model: "gemma3:4b", // 使用本地已拉取的模型
  baseUrl: "http://[240e:305:67ad:5b00:5680:9048:1114:513d]:11434", // Ollama 服务地址
  temperature: 0.7, // 对话场景可以稍微提高温度，增加多样性
  numCtx: 4096, // 增大上下文窗口以支持多轮对话
});

// 3. 定义工作流状态（支持多轮对话历史）
interface ChatState {
  messages: BaseMessage[]; // 对话历史记录
  user_input: string; // 当前用户输入
  ai_response?: string; // AI 回复
  conversation_summary?: string; // 对话摘要（可选）
  turn_count: number; // 对话轮数
}

// 4. 定义工作流节点函数
async function processUserInput(
  state: ChatState
): Promise<Partial<ChatState>> {
  // 节点1：处理用户输入，添加到消息历史
  const messages = state.messages || [];
  const user_input = state.user_input;

  // 将用户消息添加到历史
  messages.push(new HumanMessage(user_input));

  return {
    messages,
    turn_count: (state.turn_count || 0) + 1,
  };
}

async function generateResponse(
  state: ChatState
): Promise<Partial<ChatState>> {
  // 节点2：基于对话历史生成 AI 回复
  const messages = state.messages;

  // 使用完整的对话历史调用模型
  const response = await llm.invoke(messages);

  // 将 AI 回复添加到历史
  messages.push(new AIMessage(response.content as string));

  return {
    messages,
    ai_response: response.content as string,
  };
}

async function checkConversationLength(
  state: ChatState
): Promise<Partial<ChatState>> {
  // 节点3：检查对话长度，必要时生成摘要
  const messages = state.messages;
  const turn_count = state.turn_count;

  // 每 5 轮对话生成一次摘要
  if (turn_count % 5 === 0 && turn_count > 0) {
    // 构建摘要提示
    const recentMessages = messages.slice(-10); // 只摘要最近 10 条消息
    const conversation_text = recentMessages
      .map((msg) => {
        const role = msg instanceof HumanMessage ? "用户" : "AI";
        return `${role}: ${msg.content}`;
      })
      .join("\n");

    const summary_prompt = `
请简要总结以下对话的主要内容和关键点：
${conversation_text}

摘要（不超过100字）：
    `;

    const summary_response = await llm.invoke(summary_prompt);

    return { conversation_summary: summary_response.content as string };
  }

  return {};
}

async function formatOutput(state: ChatState): Promise<Partial<ChatState>> {
  // 节点4：格式化输出（可选的后处理节点）
  // 这里可以添加额外的格式化逻辑
  // 例如：添加表情、格式化代码块等
  return {};
}

// 5. 构建 StateGraph 工作流
function buildChatWorkflow() {
  // 初始化状态图
  const graph = new StateGraph<ChatState>({
    channels: {
      messages: {
        value: (left?: BaseMessage[], right?: BaseMessage[]) =>
          right || left || [],
        default: () => [],
      },
      user_input: null,
      ai_response: null,
      conversation_summary: null,
      turn_count: {
        value: (left?: number, right?: number) =>
          right !== undefined ? right : left || 0,
        default: () => 0,
      },
    },
  });

  // 添加工作流节点
  graph.addNode("process_input", processUserInput);
  graph.addNode("generate_response", generateResponse);
  graph.addNode("check_length", checkConversationLength);
  graph.addNode("format_output", formatOutput);

  // 设置起始节点
  graph.addEdge(START, "process_input");

  // 添加边（构建线性流程）
  graph.addEdge("process_input", "generate_response");
  graph.addEdge("generate_response", "check_length");
  graph.addEdge("check_length", "format_output");
  graph.addEdge("format_output", END);

  // 编译工作流
  return graph.compile();
}

// 6. 交互式对话循环
async function interactiveChat() {
  console.log("=".repeat(60));
  console.log("🤖 多轮对话机器人已启动！");
  console.log("提示：输入 'quit' 或 'exit' 退出对话");
  console.log("提示：输入 'summary' 查看对话摘要");
  console.log("💡 提示：使用 ↑↓ 键浏览历史问题");
  console.log("=".repeat(60));

  // 构建工作流
  const chatWorkflow = buildChatWorkflow();

  // 初始化对话状态
  let state: ChatState = {
    messages: [],
    user_input: "",
    turn_count: 0,
  };

  // 创建 readline 接口
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  // 配置历史记录文件
  const historyFile = path.join(os.homedir(), ".langgraph_chat_history_ts");

  // 加载历史记录
  if (fs.existsSync(historyFile)) {
    const history = fs
      .readFileSync(historyFile, "utf-8")
      .split("\n")
      .filter((line) => line.trim());
    history.forEach((line) => {
      (rl as any).history.push(line);
    });
  }

  // 保存历史记录的函数
  const saveHistory = () => {
    const history = (rl as any).history || [];
    fs.writeFileSync(historyFile, history.slice(0, 1000).join("\n"));
  };

  // 处理退出
  process.on("SIGINT", () => {
    console.log("\n👋 再见！感谢使用多轮对话机器人。");
    saveHistory();
    process.exit(0);
  });

  // 主对话循环
  const askQuestion = () => {
    rl.question("\n👤 你: ", async (userInput) => {
      const input = userInput.trim();

      // 检查退出命令
      if (["quit", "exit", "退出"].includes(input.toLowerCase())) {
        console.log("\n👋 再见！感谢使用多轮对话机器人。");
        saveHistory();
        rl.close();
        return;
      }

      // 检查摘要命令
      if (input.toLowerCase() === "summary") {
        if (state.conversation_summary) {
          console.log(`\n📝 对话摘要：${state.conversation_summary}`);
        } else {
          console.log("\n📝 暂无对话摘要（每5轮对话自动生成）");
        }
        askQuestion();
        return;
      }

      // 跳过空输入
      if (!input) {
        askQuestion();
        return;
      }

      // 更新状态并运行工作流
      state.user_input = input;
      const result = await chatWorkflow.invoke(state);

      // 更新状态
      state = result as ChatState;

      // 显示 AI 回复
      console.log(`\n🤖 AI: ${result.ai_response}`);

      // 如果生成了新摘要，显示提示
      if (
        result.conversation_summary &&
        result.turn_count &&
        result.turn_count % 5 === 0
      ) {
        console.log(
          `\n💡 [已生成第 ${result.turn_count} 轮对话摘要，输入 'summary' 查看]`
        );
      }

      askQuestion();
    });
  };

  askQuestion();
}

// 7. 单次对话测试函数
async function testSingleConversation() {
  console.log("=".repeat(60));
  console.log("🧪 测试模式：模拟多轮对话");
  console.log("=".repeat(60));

  const chatWorkflow = buildChatWorkflow();

  // 模拟多轮对话
  const testConversations = [
    "你好，请介绍一下 LangGraph",
    "它和 LangChain 有什么区别？",
    "能举个实际应用的例子吗？",
  ];

  let state: ChatState = {
    messages: [],
    user_input: "",
    turn_count: 0,
  };

  for (const userInput of testConversations) {
    console.log(`\n👤 用户: ${userInput}`);

    state.user_input = userInput;
    const result = await chatWorkflow.invoke(state);
    state = result as ChatState;

    console.log(`🤖 AI: ${result.ai_response}`);
    console.log(`📊 当前轮数: ${result.turn_count}`);
  }

  console.log("\n" + "=".repeat(60));
}

// 8. 主函数
async function main() {
  const args = process.argv.slice(2);

  // 检查命令行参数
  if (args.length > 0 && args[0] === "test") {
    // 测试模式
    await testSingleConversation();
  } else {
    // 交互模式
    await interactiveChat();
  }
}

// 执行主函数
main().catch(console.error);

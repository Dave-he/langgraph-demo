// 1. 导入核心依赖
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { StateGraph, END, START } from "@langchain/langgraph";
import * as readline from "readline";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

// 2. 初始化本地 Ollama 模型
const llm = new ChatOllama({
  model: "gemma3:4b",
  baseUrl: "http://[240e:305:67ad:5b00:5680:9048:1114:513d]:11434",
  temperature: 0.2, // 工具调用需要更精确的输出
  numCtx: 4096,
});

// 3. 定义可用工具（模拟函数）
function getWeather(city: string): string {
  // 获取指定城市的天气信息（模拟）
  const weatherData: Record<string, string> = {
    北京: "晴天，温度 15-25°C，空气质量良好",
    上海: "多云，温度 18-26°C，有轻微雾霾",
    深圳: "阴天，温度 22-28°C，下午可能有小雨",
    成都: "阴天，温度 16-22°C，湿度较高",
  };
  return weatherData[city] || `${city}的天气信息暂时无法获取`;
}

function calculate(expression: string): string {
  // 计算数学表达式（模拟）
  try {
    // 安全的数学表达式计算
    const result = eval(expression);
    return `计算结果：${expression} = ${result}`;
  } catch (e) {
    return `计算错误：${(e as Error).message}`;
  }
}

function searchKnowledge(query: string): string {
  // 搜索知识库（模拟）
  const knowledgeBase: Record<string, string> = {
    langgraph:
      "LangGraph 是一个用于构建有状态、多参与者应用程序的库，基于 LangChain 构建。",
    langchain: "LangChain 是一个用于开发由语言模型驱动的应用程序的框架。",
    python: "Python 是一种高级编程语言，以其简洁的语法和强大的功能而闻名。",
  };

  for (const [key, value] of Object.entries(knowledgeBase)) {
    if (query.toLowerCase().includes(key)) {
      return value;
    }
  }

  return `未找到关于 '${query}' 的相关信息`;
}

// 工具注册表
interface Tool {
  function: (input: string) => string;
  description: string;
  parameters: Record<string, string>;
}

const TOOLS: Record<string, Tool> = {
  get_weather: {
    function: getWeather,
    description: "获取指定城市的天气信息",
    parameters: { city: "城市名称" },
  },
  calculate: {
    function: calculate,
    description: "计算数学表达式",
    parameters: { expression: "数学表达式" },
  },
  search_knowledge: {
    function: searchKnowledge,
    description: "搜索知识库",
    parameters: { query: "搜索查询" },
  },
};

// 4. 定义工作流状态
interface AgentState {
  user_query: string; // 用户查询
  thought?: string; // AI 的思考过程
  tool_name?: string; // 选择的工具名称
  tool_input?: string; // 工具输入参数
  tool_output?: string; // 工具执行结果
  final_answer?: string; // 最终回答
  needs_tool: boolean; // 是否需要使用工具
  iteration: number; // 迭代次数（防止无限循环）
}

// 5. 定义工作流节点函数
async function analyzeQuery(state: AgentState): Promise<Partial<AgentState>> {
  // 节点1：分析用户查询，判断是否需要使用工具
  const userQuery = state.user_query;

  // 使用关键词匹配来判断是否需要工具（更可靠的方法）
  const queryLower = userQuery.toLowerCase();

  // 天气查询检测
  const weatherKeywords = ["天气", "气温", "温度", "下雨", "晴天", "阴天"];
  const cities = ["北京", "上海", "深圳", "成都", "广州", "杭州", "南京", "武汉"];

  if (weatherKeywords.some((keyword) => queryLower.includes(keyword))) {
    // 提取城市名称
    let city: string | null = null;
    for (const c of cities) {
      if (userQuery.includes(c)) {
        city = c;
        break;
      }
    }

    if (city) {
      return {
        needs_tool: true,
        tool_name: "get_weather",
        tool_input: city,
        thought: `检测到天气查询，需要查询${city}的天气信息`,
        iteration: state.iteration || 0,
      };
    }
  }

  // 计算检测
  const calcKeywords = ["计算", "等于", "加", "减", "乘", "除", "*", "+", "-", "/"];
  if (calcKeywords.some((keyword) => queryLower.includes(keyword))) {
    // 提取数学表达式
    const expressionMatch = userQuery.match(/[\d\s+\-*/().]+/);
    if (expressionMatch) {
      const expression = expressionMatch[0].trim();
      return {
        needs_tool: true,
        tool_name: "calculate",
        tool_input: expression,
        thought: `检测到数学计算需求，需要计算表达式：${expression}`,
        iteration: state.iteration || 0,
      };
    }
  }

  // 知识搜索检测
  const knowledgeKeywords = [
    "什么是",
    "介绍",
    "解释",
    "langgraph",
    "langchain",
    "python",
  ];
  if (knowledgeKeywords.some((keyword) => queryLower.includes(keyword))) {
    return {
      needs_tool: true,
      tool_name: "search_knowledge",
      tool_input: userQuery,
      thought: "检测到知识查询需求，需要搜索知识库",
      iteration: state.iteration || 0,
    };
  }

  // 如果不匹配任何工具，直接回答
  const prompt = `请简洁地回答：${userQuery}`;
  const response = await llm.invoke(prompt);

  return {
    needs_tool: false,
    final_answer: response.content as string,
    thought: "不需要使用工具，直接回答",
    iteration: state.iteration || 0,
  };
}

async function executeTool(state: AgentState): Promise<Partial<AgentState>> {
  // 节点2：执行选定的工具
  const toolName = state.tool_name!;
  const toolInput = state.tool_input!;

  if (toolName in TOOLS) {
    const toolFunc = TOOLS[toolName].function;
    try {
      const output = toolFunc(toolInput);
      return { tool_output: output };
    } catch (e) {
      return { tool_output: `工具执行错误：${(e as Error).message}` };
    }
  } else {
    return { tool_output: `未找到工具：${toolName}` };
  }
}

async function generateFinalAnswer(
  state: AgentState
): Promise<Partial<AgentState>> {
  // 节点3：基于工具输出生成最终回答
  const userQuery = state.user_query;
  const toolOutput = state.tool_output || "";
  const toolName = state.tool_name || "";

  // 直接使用工具输出作为回答的一部分，确保真实数据被使用
  let finalAnswer: string;

  if (toolName === "get_weather") {
    // 天气查询直接返回工具结果
    finalAnswer = `根据查询结果：${toolOutput}`;
  } else if (toolName === "calculate") {
    // 计算结果直接返回
    finalAnswer = toolOutput;
  } else if (toolName === "search_knowledge") {
    // 知识搜索结果
    finalAnswer = `根据知识库：${toolOutput}`;
  } else {
    // 其他情况，用 LLM 生成自然语言回答
    const prompt = `
用户问题：${userQuery}
工具返回的真实数据：${toolOutput}

请基于工具返回的真实数据，用自然、友好的语言回答用户的问题。
注意：必须使用工具返回的真实数据，不要编造信息。
    `;
    const response = await llm.invoke(prompt);
    finalAnswer = response.content as string;
  }

  return { final_answer: finalAnswer };
}

async function directAnswer(state: AgentState): Promise<Partial<AgentState>> {
  // 节点4：直接回答（不使用工具的情况）
  // 如果已经有 final_answer，直接返回
  if (state.final_answer) {
    return {};
  }

  // 否则生成回答
  const userQuery = state.user_query;
  const prompt = `请简洁明了地回答：${userQuery}`;
  const response = await llm.invoke(prompt);

  return { final_answer: response.content as string };
}

// 6. 定义分支判断函数
function shouldUseTool(state: AgentState): string {
  // 判断是否需要使用工具
  // 防止无限循环
  if ((state.iteration || 0) > 3) {
    return "direct_answer";
  }

  return state.needs_tool ? "execute_tool" : "direct_answer";
}

// 7. 构建 StateGraph 工作流
function buildAgentWorkflow() {
  // 初始化状态图
  const graph = new StateGraph<AgentState>({
    channels: {
      user_query: null,
      thought: null,
      tool_name: null,
      tool_input: null,
      tool_output: null,
      final_answer: null,
      needs_tool: null,
      iteration: null,
    },
  });

  // 添加工作流节点
  graph.addNode("analyze", analyzeQuery);
  graph.addNode("execute_tool", executeTool);
  graph.addNode("generate_answer", generateFinalAnswer);
  graph.addNode("direct_answer", directAnswer);

  // 设置起始节点
  graph.addEdge(START, "analyze");

  // 添加条件边
  graph.addConditionalEdges("analyze", shouldUseTool, {
    execute_tool: "execute_tool",
    direct_answer: "direct_answer",
  });

  // 添加普通边
  graph.addEdge("execute_tool", "generate_answer");
  graph.addEdge("generate_answer", END);
  graph.addEdge("direct_answer", END);

  // 编译工作流
  return graph.compile();
}

// 8. 运行示例
async function runExamples() {
  const agent = buildAgentWorkflow();

  // 测试查询列表
  const testQueries = [
    "北京今天天气怎么样？",
    "帮我计算 123 * 456",
    "什么是 LangGraph？",
    "你好，请介绍一下你自己",
  ];

  console.log("=".repeat(60));
  console.log("🤖 智能工具调用 Agent 演示");
  console.log("=".repeat(60));

  for (const query of testQueries) {
    console.log("\n" + "=".repeat(60));
    console.log(`👤 用户查询：${query}`);
    console.log("=".repeat(60));

    // 运行工作流
    const result = await agent.invoke({
      user_query: query,
      needs_tool: false,
      iteration: 0,
    });

    // 显示结果
    if (result.thought) {
      console.log(`💭 思考过程：${result.thought}`);
    }

    if (result.needs_tool) {
      console.log(`🔧 使用工具：${result.tool_name}`);
      console.log(`📥 工具输入：${result.tool_input}`);
      console.log(`📤 工具输出：${result.tool_output}`);
    }

    console.log(`\n✅ 最终回答：${result.final_answer}`);
  }

  console.log("\n" + "=".repeat(60));
}

// 9. 交互式模式
async function interactiveAgent() {
  const agent = buildAgentWorkflow();

  console.log("=".repeat(60));
  console.log("🤖 智能工具调用 Agent 已启动！");
  console.log("可用工具：天气查询、数学计算、知识搜索");
  console.log("💡 提示：使用 ↑↓ 键浏览历史问题");
  console.log("输入 'quit' 退出");
  console.log("=".repeat(60));

  // 创建 readline 接口
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  // 配置历史记录文件
  const historyFile = path.join(os.homedir(), ".langgraph_agent_history_ts");

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
    console.log("\n👋 再见！");
    saveHistory();
    process.exit(0);
  });

  // 主对话循环
  const askQuestion = () => {
    rl.question("\n👤 你: ", async (userQuery) => {
      const query = userQuery.trim();

      if (["quit", "exit", "退出"].includes(query.toLowerCase())) {
        console.log("\n👋 再见！");
        saveHistory();
        rl.close();
        return;
      }

      if (!query) {
        askQuestion();
        return;
      }

      // 运行工作流
      const result = await agent.invoke({
        user_query: query,
        needs_tool: false,
        iteration: 0,
      });

      // 显示详细过程
      if (result.thought) {
        console.log(`\n💭 思考：${result.thought}`);
      }

      if (result.needs_tool && result.tool_name) {
        console.log(`🔧 调用工具：${result.tool_name}(${result.tool_input})`);
        console.log(`📤 工具结果：${result.tool_output}`);
      }

      console.log(`\n🤖 回答：${result.final_answer}`);

      askQuestion();
    });
  };

  askQuestion();
}

// 10. 主函数
async function main() {
  const args = process.argv.slice(2);

  if (args.length > 0 && args[0] === "demo") {
    // 演示模式
    await runExamples();
  } else {
    // 交互模式
    await interactiveAgent();
  }
}

// 执行主函数
main().catch(console.error);

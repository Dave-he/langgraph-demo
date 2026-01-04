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
  temperature: 0.5,
  numCtx: 4096,
});

// 3. 定义工作流状态（内容审核与生成流程）
interface ContentWorkflowState {
  topic: string; // 内容主题
  draft_content?: string; // 初稿内容
  review_result?: ReviewResult; // 审核结果
  revision_count: number; // 修订次数
  final_content?: string; // 最终内容
  is_approved: boolean; // 是否通过审核
  feedback?: string; // 审核反馈
}

interface ReviewResult {
  score: number;
  is_approved: boolean;
  feedback: string;
}

// 4. 定义工作流节点函数
async function generateDraft(
  state: ContentWorkflowState
): Promise<Partial<ContentWorkflowState>> {
  // 节点1：生成初稿内容
  const topic = state.topic;
  const revisionCount = state.revision_count || 0;

  let prompt: string;

  if (revisionCount === 0) {
    // 首次生成
    prompt = `
请围绕主题「${topic}」撰写一篇简短的文章（200-300字）。
要求：
1. 内容准确、有价值
2. 语言流畅、易懂
3. 结构清晰（引言-正文-结论）
    `;
  } else {
    // 根据反馈修订
    const feedback = state.feedback || "";
    const draft = state.draft_content || "";
    prompt = `
原文：
${draft}

审核反馈：
${feedback}

请根据反馈修改文章，保持主题「${topic}」不变。
    `;
  }

  const response = await llm.invoke(prompt);

  return {
    draft_content: response.content as string,
    revision_count: revisionCount,
  };
}

async function reviewContent(
  state: ContentWorkflowState
): Promise<Partial<ContentWorkflowState>> {
  // 节点2：审核内容质量
  const draft = state.draft_content!;
  const topic = state.topic;

  const prompt = `
请审核以下文章的质量：

主题：${topic}
文章内容：
${draft}

审核标准：
1. 内容是否切题（权重30%）
2. 信息是否准确完整（权重30%）
3. 语言是否流畅（权重20%）
4. 结构是否清晰（权重20%）

请按以下格式返回审核结果（只返回这个格式，不要其他内容）：
评分：[0-100的整数]
是否通过：[通过/不通过]
反馈：[具体的改进建议，如果通过则写"无需修改"]
  `;

  const response = await llm.invoke(prompt);
  const content = (response.content as string).trim();

  // 解析审核结果
  const lines = content.split("\n");
  let score = 0;
  let isApproved = false;
  let feedback = "";

  for (const line of lines) {
    if (line.startsWith("评分")) {
      try {
        const digits = line.match(/\d+/);
        score = digits ? parseInt(digits[0]) : 0;
      } catch {
        score = 0;
      }
    } else if (line.startsWith("是否通过")) {
      isApproved = line.includes("通过") && !line.includes("不通过");
    } else if (line.startsWith("反馈")) {
      feedback = line.replace("反馈：", "").trim();
    }
  }

  return {
    review_result: {
      score,
      is_approved: isApproved,
      feedback,
    },
    is_approved: isApproved,
    feedback,
  };
}

async function reviseContent(
  state: ContentWorkflowState
): Promise<Partial<ContentWorkflowState>> {
  // 节点3：修订内容（增加修订计数）
  return {
    revision_count: state.revision_count + 1,
  };
}

async function finalizeContent(
  state: ContentWorkflowState
): Promise<Partial<ContentWorkflowState>> {
  // 节点4：确定最终内容
  return {
    final_content: state.draft_content,
  };
}

async function rejectContent(
  state: ContentWorkflowState
): Promise<Partial<ContentWorkflowState>> {
  // 节点5：拒绝内容（超过最大修订次数）
  return {
    final_content: undefined,
    feedback: "内容经过多次修订仍未达标，建议重新选择主题或调整方向。",
  };
}

// 5. 定义分支判断函数
function decideNextStep(state: ContentWorkflowState): string {
  // 判断下一步操作
  const isApproved = state.is_approved || false;
  const revisionCount = state.revision_count || 0;

  // 如果通过审核，进入最终确认
  if (isApproved) {
    return "finalize";
  }

  // 如果修订次数超过3次，拒绝内容
  if (revisionCount >= 3) {
    return "reject";
  }

  // 否则继续修订
  return "revise";
}

// 6. 构建 StateGraph 工作流
function buildContentWorkflow() {
  // 初始化状态图
  const graph = new StateGraph<ContentWorkflowState>({
    channels: {
      topic: null,
      draft_content: null,
      review_result: null,
      revision_count: null,
      final_content: null,
      is_approved: null,
      feedback: null,
    },
  });

  // 添加工作流节点
  graph.addNode("generate_draft", generateDraft);
  graph.addNode("review_content", reviewContent);
  graph.addNode("revise", reviseContent);
  graph.addNode("finalize", finalizeContent);
  graph.addNode("reject", rejectContent);

  // 设置起始节点
  graph.addEdge(START, "generate_draft");

  // 添加边
  graph.addEdge("generate_draft", "review_content");
  graph.addEdge("revise", "generate_draft"); // 修订后重新生成
  graph.addEdge("finalize", END);
  graph.addEdge("reject", END);

  // 添加条件边（审核后的分支）
  graph.addConditionalEdges("review_content", decideNextStep, {
    finalize: "finalize",
    revise: "revise",
    reject: "reject",
  });

  // 编译工作流
  return graph.compile();
}

// 7. 可视化工作流执行过程
function visualizeWorkflowExecution(state: ContentWorkflowState, step: string) {
  const stepsEmoji: Record<string, string> = {
    generate_draft: "✍️",
    review_content: "🔍",
    revise: "🔄",
    finalize: "✅",
    reject: "❌",
  };

  console.log(`\n${stepsEmoji[step] || "📍"} 当前步骤：${step}`);
  console.log(`   修订次数：${state.revision_count || 0}`);

  if (step === "review_content" && state.review_result) {
    const result = state.review_result;
    console.log(`   审核评分：${result.score || 0}/100`);
    console.log(`   审核结果：${result.is_approved ? "✅ 通过" : "❌ 未通过"}`);
    console.log(`   审核反馈：${result.feedback || ""}`);
  }
}

// 8. 运行示例
async function runContentGeneration(topic: string, verbose: boolean = true) {
  const workflow = buildContentWorkflow();

  console.log("=".repeat(60));
  console.log("📝 内容生成工作流启动");
  console.log(`主题：${topic}`);
  console.log("=".repeat(60));

  // 初始化状态
  const initialState: ContentWorkflowState = {
    topic,
    revision_count: 0,
    is_approved: false,
  };

  let finalState: ContentWorkflowState;

  // 执行工作流（逐步执行以便可视化）
  if (verbose) {
    // 手动逐步执行以显示过程
    let state = initialState;

    // 首次生成
    let result = await generateDraft(state);
    state = { ...state, ...result };
    visualizeWorkflowExecution(state, "generate_draft");
    console.log(`\n📄 生成的内容：\n${state.draft_content?.substring(0, 200)}...`);
    await sleep(1000);

    // 审核循环
    let maxRevisions = 3;
    while (state.revision_count < maxRevisions) {
      // 审核内容
      result = await reviewContent(state);
      state = { ...state, ...result };
      visualizeWorkflowExecution(state, "review_content");
      await sleep(1000);

      // 判断下一步
      const nextStep = decideNextStep(state);

      if (nextStep === "finalize") {
        result = await finalizeContent(state);
        state = { ...state, ...result };
        visualizeWorkflowExecution(state, "finalize");
        break;
      } else if (nextStep === "reject") {
        result = await rejectContent(state);
        state = { ...state, ...result };
        visualizeWorkflowExecution(state, "reject");
        break;
      } else {
        // 继续修订
        result = await reviseContent(state);
        state = { ...state, ...result };
        visualizeWorkflowExecution(state, "revise");
        await sleep(1000);

        // 重新生成
        result = await generateDraft(state);
        state = { ...state, ...result };
        visualizeWorkflowExecution(state, "generate_draft");
        console.log(
          `\n📄 修订后的内容：\n${state.draft_content?.substring(0, 200)}...`
        );
        await sleep(1000);
      }
    }

    finalState = state;
  } else {
    // 直接执行完整工作流
    finalState = (await workflow.invoke(initialState)) as ContentWorkflowState;
  }

  // 显示最终结果
  console.log("\n" + "=".repeat(60));
  console.log("📊 工作流执行完成");
  console.log("=".repeat(60));
  console.log(`总修订次数：${finalState.revision_count}`);
  console.log(
    `最终状态：${finalState.is_approved ? "✅ 通过审核" : "❌ 未通过审核"}`
  );

  if (finalState.final_content) {
    console.log(`\n✅ 最终内容：\n${finalState.final_content}`);
  } else {
    console.log("\n❌ 内容生成失败");
    console.log(`原因：${finalState.feedback || "未知"}`);
  }

  console.log("\n" + "=".repeat(60));

  return finalState;
}

// 辅助函数：延迟
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 9. 批量测试多个主题
async function batchTest() {
  const topics = [
    "人工智能在医疗领域的应用",
    "可持续发展与环境保护",
    "远程办公的优势与挑战",
  ];

  console.log("🚀 批量内容生成测试");
  console.log("=".repeat(60));

  const results: Array<{
    topic: string;
    success: boolean;
    revisions: number;
  }> = [];

  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    console.log(`\n\n${"#".repeat(60)}`);
    console.log(`测试 ${i + 1}/${topics.length}`);
    console.log("#".repeat(60));

    const result = await runContentGeneration(topic, false);
    results.push({
      topic,
      success: result.is_approved || false,
      revisions: result.revision_count || 0,
    });

    await sleep(2000); // 避免请求过快
  }

  // 汇总统计
  console.log("\n\n" + "=".repeat(60));
  console.log("📈 批量测试统计");
  console.log("=".repeat(60));

  results.forEach((result, i) => {
    const status = result.success ? "✅ 成功" : "❌ 失败";
    console.log(`${i + 1}. ${result.topic}`);
    console.log(`   状态：${status} | 修订次数：${result.revisions}`);
  });

  const successRate =
    (results.filter((r) => r.success).length / results.length) * 100;
  const avgRevisions =
    results.reduce((sum, r) => sum + r.revisions, 0) / results.length;

  console.log(`\n总体成功率：${successRate.toFixed(1)}%`);
  console.log(`平均修订次数：${avgRevisions.toFixed(1)}`);
  console.log("=".repeat(60));
}

// 10. 交互式主题输入模式
async function interactiveContentGeneration() {
  console.log("=".repeat(60));
  console.log("📝 智能内容生成系统已启动！");
  console.log("💡 提示：使用 ↑↓ 键浏览历史主题");
  console.log("输入 'quit' 退出");
  console.log("=".repeat(60));

  // 创建 readline 接口
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  // 配置历史记录文件
  const historyFile = path.join(os.homedir(), ".langgraph_content_history_ts");

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
    rl.question("\n👤 请输入内容主题: ", async (topic) => {
      const topicTrimmed = topic.trim();

      if (["quit", "exit", "退出"].includes(topicTrimmed.toLowerCase())) {
        console.log("\n👋 再见！");
        saveHistory();
        rl.close();
        return;
      }

      if (!topicTrimmed) {
        askQuestion();
        return;
      }

      // 运行内容生成工作流
      await runContentGeneration(topicTrimmed, true);

      console.log("\n" + "=".repeat(60));

      askQuestion();
    });
  };

  askQuestion();
}

// 11. 主函数
async function main() {
  const args = process.argv.slice(2);

  if (args.length > 0) {
    if (args[0] === "batch") {
      // 批量测试模式
      await batchTest();
    } else if (args[0] === "interactive") {
      // 交互模式
      await interactiveContentGeneration();
    } else {
      // 自定义主题
      const topic = args.join(" ");
      await runContentGeneration(topic, true);
    }
  } else {
    // 默认交互模式
    await interactiveContentGeneration();
  }
}

// 执行主函数
main().catch(console.error);

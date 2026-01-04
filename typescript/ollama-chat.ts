// 1. 导入核心依赖
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { StateGraph, END, START } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

// 2. 初始化本地 Ollama 模型（核心：指定你的本地地址和端口）
const llm = new ChatOllama({
  model: "gemma3:12b", // 本地已拉取的 Ollama 模型名称（可替换为 qwen/mistral 等）
  baseUrl: "http://[240e:305:67ad:5b00:5680:9048:1114:513d]:11434", // 你的 Ollama 服务地址（使用 localhost 或 127.0.0.1）
  temperature: 0.3, // 温度系数，越低回答越严谨
  numCtx: 2048, // 上下文窗口大小，可根据模型支持调整
});

// 3. 定义工作流状态（与之前逻辑一致，强类型管理输入/中间状态/输出）
interface QAWorkflowState {
  question: string; // 用户问题（输入）
  initial_answer?: string; // 初步回答（中间状态）
  is_satisfactory?: boolean; // 回答是否合格（分支判断依据）
  optimized_answer?: string; // 优化后的回答（中间状态）
  final_answer?: string; // 最终回答（输出）
}

// 4. 定义工作流节点函数（业务逻辑不变，仅底层模型替换为本地 Ollama）
async function generateInitialAnswer(
  state: QAWorkflowState
): Promise<Partial<QAWorkflowState>> {
  // 节点1：生成初步回答
  const prompt = `请简洁明了地回答用户问题：${state.question}`;
  const response = await llm.invoke(prompt);
  return { initial_answer: response.content as string };
}

async function checkAnswerQuality(
  state: QAWorkflowState
): Promise<Partial<QAWorkflowState>> {
  // 节点2：校验回答质量
  const prompt = `
    请校验以下回答是否满足用户需求：
    用户问题：${state.question}
    初步回答：${state.initial_answer}
    校验标准：1. 回答准确无误；2. 信息完整；3. 语言简洁。
    请仅返回布尔值：合格返回 True，不合格返回 False，不要附加其他内容。
    `;
  const response = await llm.invoke(prompt);
  // 解析 Ollama 返回的校验结果（兼容模型可能的多余换行/空格）
  const is_satisfactory =
    (response.content as string).trim().toLowerCase() === "true";
  return { is_satisfactory };
}

async function optimizeAnswer(
  state: QAWorkflowState
): Promise<Partial<QAWorkflowState>> {
  // 节点3：优化不合格的回答
  const prompt = `
    以下回答不满足用户需求，请你优化它：
    用户问题：${state.question}
    初步回答：${state.initial_answer}
    优化要求：1. 修正错误（若有）；2. 补充缺失信息；3. 保持语言简洁。
    `;
  const response = await llm.invoke(prompt);
  return { optimized_answer: response.content as string };
}

async function generateFinalAnswer(
  state: QAWorkflowState
): Promise<Partial<QAWorkflowState>> {
  // 节点4：生成最终回答（根据校验结果选择对应回答）
  const final_answer = state.is_satisfactory
    ? state.initial_answer
    : state.optimized_answer;
  return { final_answer };
}

// 5. 定义分支判断函数（决定工作流走向，逻辑不变）
function decideNextStep(state: QAWorkflowState): string {
  // 根据回答质量判断下一步：合格则生成最终回答，不合格则优化
  return state.is_satisfactory ? "generate_final_answer" : "optimize_answer";
}

// 6. 构建 StateGraph 工作流
function buildQAWorkflow() {
  // 初始化状态图，绑定状态类型
  const graph = new StateGraph<QAWorkflowState>({
    channels: {
      question: null,
      initial_answer: null,
      is_satisfactory: null,
      optimized_answer: null,
      final_answer: null,
    },
  });

  // 添加工作流节点
  graph.addNode("generate_initial_answer", generateInitialAnswer);
  graph.addNode("check_answer_quality", checkAnswerQuality);
  graph.addNode("optimize_answer", optimizeAnswer);
  graph.addNode("generate_final_answer", generateFinalAnswer);

  // 设置起始节点
  graph.addEdge(START, "generate_initial_answer");

  // 添加普通边（构建基础流程）
  graph.addEdge("generate_initial_answer", "check_answer_quality"); // 初步回答 → 质量校验
  graph.addEdge("optimize_answer", "check_answer_quality"); // 优化后 → 重新校验（形成循环）
  graph.addEdge("generate_final_answer", END); // 最终回答 → 工作流结束

  // 添加条件边（核心分支逻辑）
  graph.addConditionalEdges(
    "check_answer_quality", // 分支起始节点
    decideNextStep, // 分支判断函数
    {
      // 判断结果与目标节点的映射
      generate_final_answer: "generate_final_answer",
      optimize_answer: "optimize_answer",
    }
  );

  // 编译工作流
  return graph.compile();
}

// 7. 运行工作流
async function main() {
  // 构建工作流实例
  const qaWorkflow = buildQAWorkflow();

  // 定义用户问题（可自定义修改）
  const userQuestion =
    "请详细解释 LangGraph 与 LangChain 的核心区别，以及 LangGraph 的核心优势";

  // 传入初始状态，运行工作流
  const result = await qaWorkflow.invoke({
    question: userQuestion,
  });

  // 打印执行结果
  console.log("=".repeat(60));
  console.log(`用户问题：${result.question}`);
  console.log(`初步回答：${result.initial_answer}`);
  console.log(`回答是否合格：${result.is_satisfactory}`);
  if (!result.is_satisfactory) {
    console.log(`优化后回答：${result.optimized_answer}`);
  }
  console.log(`最终回答：${result.final_answer}`);
  console.log("=".repeat(60));
}

// 执行主函数
main().catch(console.error);

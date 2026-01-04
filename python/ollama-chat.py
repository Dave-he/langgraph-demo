# 1. 导入核心依赖
from langchain_ollama import ChatOllama
from langgraph.graph import StateGraph, END
from typing import TypedDict, Optional

# 2. 初始化本地 Ollama 模型（核心：指定你的 IPv6 地址和端口）
llm = ChatOllama(
    model="gemma3:12b",  # 本地已拉取的 Ollama 模型名称（可替换为 qwen/mistral 等）
    base_url="http://[240e:305:67ad:5b00:5680:9048:1114:513d]:11434",  # 你的 Ollama 服务地址
    temperature=0.3,  # 温度系数，越低回答越严谨
    num_ctx=2048  # 上下文窗口大小，可根据模型支持调整
)

# 3. 定义工作流状态（与之前逻辑一致，强类型管理输入/中间状态/输出）
class QAWorkflowState(TypedDict):
    question: str  # 用户问题（输入）
    initial_answer: Optional[str]  # 初步回答（中间状态）
    is_satisfactory: Optional[bool]  # 回答是否合格（分支判断依据）
    optimized_answer: Optional[str]  # 优化后的回答（中间状态）
    final_answer: Optional[str]  # 最终回答（输出）

# 4. 定义工作流节点函数（业务逻辑不变，仅底层模型替换为本地 Ollama）
def generate_initial_answer(state: QAWorkflowState) -> dict:
    """节点1：生成初步回答"""
    prompt = f"请简洁明了地回答用户问题：{state['question']}"
    response = llm.invoke(prompt)
    return {"initial_answer": response.content}

def check_answer_quality(state: QAWorkflowState) -> dict:
    """节点2：校验回答质量"""
    prompt = f"""
    请校验以下回答是否满足用户需求：
    用户问题：{state['question']}
    初步回答：{state['initial_answer']}
    校验标准：1. 回答准确无误；2. 信息完整；3. 语言简洁。
    请仅返回布尔值：合格返回 True，不合格返回 False，不要附加其他内容。
    """
    response = llm.invoke(prompt)
    # 解析 Ollama 返回的校验结果（兼容模型可能的多余换行/空格）
    is_satisfactory = response.content.strip().lower() == "true"
    return {"is_satisfactory": is_satisfactory}

def optimize_answer(state: QAWorkflowState) -> dict:
    """节点3：优化不合格的回答"""
    prompt = f"""
    以下回答不满足用户需求，请你优化它：
    用户问题：{state['question']}
    初步回答：{state['initial_answer']}
    优化要求：1. 修正错误（若有）；2. 补充缺失信息；3. 保持语言简洁。
    """
    response = llm.invoke(prompt)
    return {"optimized_answer": response.content}

def generate_final_answer(state: QAWorkflowState) -> dict:
    """节点4：生成最终回答（根据校验结果选择对应回答）"""
    final_answer = state["initial_answer"] if state["is_satisfactory"] else state["optimized_answer"]
    return {"final_answer": final_answer}

# 5. 定义分支判断函数（决定工作流走向，逻辑不变）
def decide_next_step(state: QAWorkflowState) -> str:
    """根据回答质量判断下一步：合格则生成最终回答，不合格则优化"""
    return "generate_final_answer" if state["is_satisfactory"] else "optimize_answer"

# 6. 构建 StateGraph 工作流
def build_qa_workflow():
    # 初始化状态图，绑定状态类型
    graph = StateGraph(QAWorkflowState)

    # 添加工作流节点
    graph.add_node("generate_initial_answer", generate_initial_answer)
    graph.add_node("check_answer_quality", check_answer_quality)
    graph.add_node("optimize_answer", optimize_answer)
    graph.add_node("generate_final_answer", generate_final_answer)

    # 设置起始节点
    graph.set_entry_point("generate_initial_answer")

    # 添加普通边（构建基础流程）
    graph.add_edge("generate_initial_answer", "check_answer_quality")  # 初步回答 → 质量校验
    graph.add_edge("optimize_answer", "check_answer_quality")  # 优化后 → 重新校验（形成循环）
    graph.add_edge("generate_final_answer", END)  # 最终回答 → 工作流结束

    # 添加条件边（核心分支逻辑）
    graph.add_conditional_edges(
        source="check_answer_quality",  # 分支起始节点
        path=decide_next_step,  # 分支判断函数
        path_map={  # 判断结果与目标节点的映射（可选，此处为清晰展示保留）
            "generate_final_answer": "generate_final_answer",
            "optimize_answer": "optimize_answer"
        }
    )

    # 编译工作流
    return graph.compile()

# 7. 运行工作流
if __name__ == "__main__":
    # 构建工作流实例
    qa_workflow = build_qa_workflow()

    # 定义用户问题（可自定义修改）
    user_question = "请详细解释 LangGraph 与 LangChain 的核心区别，以及 LangGraph 的核心优势"

    # 传入初始状态，运行工作流
    result = qa_workflow.invoke({
        "question": user_question
    })

    # 打印执行结果
    print("=" * 60)
    print(f"用户问题：{result['question']}")
    print(f"初步回答：{result['initial_answer']}")
    print(f"回答是否合格：{result['is_satisfactory']}")
    if not result["is_satisfactory"]:
        print(f"优化后回答：{result['optimized_answer']}")
    print(f"最终回答：{result['final_answer']}")
    print("=" * 60)
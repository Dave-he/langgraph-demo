# 1. 导入核心依赖
from langchain_ollama import ChatOllama
from langgraph.graph import StateGraph, END
from typing import TypedDict, List, Optional
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage

# 2. 初始化本地 Ollama 模型
llm = ChatOllama(
    model="gemma3:12b",  # 使用本地已拉取的模型
    base_url="http://[240e:305:67ad:5b00:5680:9048:1114:513d]:11434",  # Ollama 服务地址
    temperature=0.7,  # 对话场景可以稍微提高温度，增加多样性
    num_ctx=4096  # 增大上下文窗口以支持多轮对话
)

# 3. 定义工作流状态（支持多轮对话历史）
class ChatState(TypedDict):
    messages: List[BaseMessage]  # 对话历史记录
    user_input: str  # 当前用户输入
    ai_response: Optional[str]  # AI 回复
    conversation_summary: Optional[str]  # 对话摘要（可选）
    turn_count: int  # 对话轮数

# 4. 定义工作流节点函数
def process_user_input(state: ChatState) -> dict:
    """节点1：处理用户输入，添加到消息历史"""
    messages = state.get("messages", [])
    user_input = state["user_input"]
    
    # 将用户消息添加到历史
    messages.append(HumanMessage(content=user_input))
    
    return {
        "messages": messages,
        "turn_count": state.get("turn_count", 0) + 1
    }

def generate_response(state: ChatState) -> dict:
    """节点2：基于对话历史生成 AI 回复"""
    messages = state["messages"]
    
    # 使用完整的对话历史调用模型
    response = llm.invoke(messages)
    
    # 将 AI 回复添加到历史
    messages.append(AIMessage(content=response.content))
    
    return {
        "messages": messages,
        "ai_response": response.content
    }

def check_conversation_length(state: ChatState) -> dict:
    """节点3：检查对话长度，必要时生成摘要"""
    messages = state["messages"]
    turn_count = state["turn_count"]
    
    # 每 5 轮对话生成一次摘要
    if turn_count % 5 == 0 and turn_count > 0:
        # 构建摘要提示
        conversation_text = "\n".join([
            f"{'用户' if isinstance(msg, HumanMessage) else 'AI'}: {msg.content}"
            for msg in messages[-10:]  # 只摘要最近 10 条消息
        ])
        
        summary_prompt = f"""
        请简要总结以下对话的主要内容和关键点：
        {conversation_text}
        
        摘要（不超过100字）：
        """
        
        summary_response = llm.invoke(summary_prompt)
        
        return {"conversation_summary": summary_response.content}
    
    return {}

def format_output(state: ChatState) -> dict:
    """节点4：格式化输出（可选的后处理节点）"""
    # 这里可以添加额外的格式化逻辑
    # 例如：添加表情、格式化代码块等
    return {}

# 5. 构建 StateGraph 工作流
def build_chat_workflow():
    # 初始化状态图
    graph = StateGraph(ChatState)
    
    # 添加工作流节点
    graph.add_node("process_input", process_user_input)
    graph.add_node("generate_response", generate_response)
    graph.add_node("check_length", check_conversation_length)
    graph.add_node("format_output", format_output)
    
    # 设置起始节点
    graph.set_entry_point("process_input")
    
    # 添加边（构建线性流程）
    graph.add_edge("process_input", "generate_response")
    graph.add_edge("generate_response", "check_length")
    graph.add_edge("check_length", "format_output")
    graph.add_edge("format_output", END)
    
    # 编译工作流
    return graph.compile()

# 6. 交互式对话循环
def interactive_chat():
    """运行交互式多轮对话（支持历史记录和上下键切换）"""
    import readline  # 提供历史记录和行编辑功能
    import os
    
    # 配置历史记录文件
    history_file = os.path.expanduser("~/.langgraph_chat_history")
    
    # 加载历史记录
    try:
        readline.read_history_file(history_file)
    except FileNotFoundError:
        pass  # 首次运行，历史文件不存在
    
    # 设置历史记录最大条数
    readline.set_history_length(1000)
    
    print("=" * 60)
    print("🤖 多轮对话机器人已启动！")
    print("提示：输入 'quit' 或 'exit' 退出对话")
    print("提示：输入 'summary' 查看对话摘要")
    print("💡 提示：使用 ↑↓ 键浏览历史问题")
    print("=" * 60)
    
    # 构建工作流
    chat_workflow = build_chat_workflow()
    
    # 初始化对话状态
    state = {
        "messages": [],
        "user_input": "",
        "turn_count": 0
    }
    
    try:
        while True:
            # 获取用户输入
            try:
                user_input = input("\n👤 你: ").strip()
            except EOFError:
                # 处理 Ctrl+D
                print("\n👋 再见！感谢使用多轮对话机器人。")
                break
            
            # 检查退出命令
            if user_input.lower() in ['quit', 'exit', '退出']:
                print("\n👋 再见！感谢使用多轮对话机器人。")
                break
            
            # 检查摘要命令
            if user_input.lower() == 'summary':
                if state.get("conversation_summary"):
                    print(f"\n📝 对话摘要：{state['conversation_summary']}")
                else:
                    print("\n📝 暂无对话摘要（每5轮对话自动生成）")
                continue
            
            # 跳过空输入
            if not user_input:
                continue
            
            # 更新状态并运行工作流
            state["user_input"] = user_input
            result = chat_workflow.invoke(state)
            
            # 更新状态
            state = result
            
            # 显示 AI 回复
            print(f"\n🤖 AI: {result['ai_response']}")
            
            # 如果生成了新摘要，显示提示
            if result.get("conversation_summary") and result["turn_count"] % 5 == 0:
                print(f"\n💡 [已生成第 {result['turn_count']} 轮对话摘要，输入 'summary' 查看]")
    
    finally:
        # 保存历史记录
        try:
            readline.write_history_file(history_file)
        except Exception as e:
            print(f"⚠️  保存历史记录失败：{e}")

# 7. 单次对话测试函数
def test_single_conversation():
    """测试单次对话（用于调试）"""
    chat_workflow = build_chat_workflow()
    
    # 模拟多轮对话
    test_conversations = [
        "你好，请介绍一下 LangGraph",
        "它和 LangChain 有什么区别？",
        "能举个实际应用的例子吗？"
    ]
    
    state = {
        "messages": [],
        "user_input": "",
        "turn_count": 0
    }
    
    print("=" * 60)
    print("🧪 测试模式：模拟多轮对话")
    print("=" * 60)
    
    for user_input in test_conversations:
        print(f"\n👤 用户: {user_input}")
        
        state["user_input"] = user_input
        result = chat_workflow.invoke(state)
        state = result
        
        print(f"🤖 AI: {result['ai_response']}")
        print(f"📊 当前轮数: {result['turn_count']}")
    
    print("\n" + "=" * 60)

# 8. 主函数
if __name__ == "__main__":
    import sys
    
    # 检查命令行参数
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        # 测试模式
        test_single_conversation()
    else:
        # 交互模式
        interactive_chat()

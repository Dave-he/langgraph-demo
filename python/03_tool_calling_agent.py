# 1. 导入核心依赖
from langchain_ollama import ChatOllama
from langgraph.graph import StateGraph, END
from typing import TypedDict, List, Optional, Dict
import json

# 2. 初始化本地 Ollama 模型
llm = ChatOllama(
    model="gemma3:12b",
    base_url="http://[240e:305:67ad:5b00:5680:9048:1114:513d]:11434",
    temperature=0.2,  # 工具调用需要更精确的输出
    num_ctx=4096
)

# 3. 定义可用工具（模拟函数）
def get_weather(city: str) -> str:
    """获取指定城市的天气信息（模拟）"""
    # 实际应用中这里会调用真实的天气 API
    weather_data = {
        "北京": "晴天，温度 15-25°C，空气质量良好",
        "上海": "多云，温度 18-26°C，有轻微雾霾",
        "深圳": "阴天，温度 22-28°C，下午可能有小雨",
        "成都": "阴天，温度 16-22°C，湿度较高"
    }
    return weather_data.get(city, f"{city}的天气信息暂时无法获取")

def calculate(expression: str) -> str:
    """计算数学表达式（模拟）"""
    try:
        # 安全的数学表达式计算
        result = eval(expression, {"__builtins__": {}}, {})
        return f"计算结果：{expression} = {result}"
    except Exception as e:
        return f"计算错误：{str(e)}"

def search_knowledge(query: str) -> str:
    """搜索知识库（模拟）"""
    # 模拟知识库
    knowledge_base = {
        "langgraph": "LangGraph 是一个用于构建有状态、多参与者应用程序的库，基于 LangChain 构建。",
        "langchain": "LangChain 是一个用于开发由语言模型驱动的应用程序的框架。",
        "python": "Python 是一种高级编程语言，以其简洁的语法和强大的功能而闻名。"
    }
    
    for key, value in knowledge_base.items():
        if key in query.lower():
            return value
    
    return f"未找到关于 '{query}' 的相关信息"

# 工具注册表
TOOLS = {
    "get_weather": {
        "function": get_weather,
        "description": "获取指定城市的天气信息",
        "parameters": {"city": "城市名称"}
    },
    "calculate": {
        "function": calculate,
        "description": "计算数学表达式",
        "parameters": {"expression": "数学表达式"}
    },
    "search_knowledge": {
        "function": search_knowledge,
        "description": "搜索知识库",
        "parameters": {"query": "搜索查询"}
    }
}

# 4. 定义工作流状态
class AgentState(TypedDict):
    user_query: str  # 用户查询
    thought: Optional[str]  # AI 的思考过程
    tool_name: Optional[str]  # 选择的工具名称
    tool_input: Optional[str]  # 工具输入参数
    tool_output: Optional[str]  # 工具执行结果
    final_answer: Optional[str]  # 最终回答
    needs_tool: bool  # 是否需要使用工具
    iteration: int  # 迭代次数（防止无限循环）

# 5. 定义工作流节点函数
def analyze_query(state: AgentState) -> dict:
    """节点1：分析用户查询，判断是否需要使用工具"""
    user_query = state["user_query"]
    
    # 使用关键词匹配来判断是否需要工具（更可靠的方法）
    query_lower = user_query.lower()
    
    # 天气查询检测
    weather_keywords = ["天气", "气温", "温度", "下雨", "晴天", "阴天"]
    cities = ["北京", "上海", "深圳", "成都", "广州", "杭州", "南京", "武汉"]
    
    if any(keyword in query_lower for keyword in weather_keywords):
        # 提取城市名称
        city = None
        for c in cities:
            if c in user_query:
                city = c
                break
        
        if city:
            return {
                "needs_tool": True,
                "tool_name": "get_weather",
                "tool_input": city,
                "thought": f"检测到天气查询，需要查询{city}的天气信息",
                "iteration": state.get("iteration", 0)
            }
    
    # 计算检测
    calc_keywords = ["计算", "等于", "加", "减", "乘", "除", "*", "+", "-", "/"]
    if any(keyword in query_lower for keyword in calc_keywords):
        # 提取数学表达式
        import re
        # 查找数字和运算符的组合
        expression_match = re.search(r'[\d\s+\-*/().]+', user_query)
        if expression_match:
            expression = expression_match.group().strip()
            return {
                "needs_tool": True,
                "tool_name": "calculate",
                "tool_input": expression,
                "thought": f"检测到数学计算需求，需要计算表达式：{expression}",
                "iteration": state.get("iteration", 0)
            }
    
    # 知识搜索检测
    knowledge_keywords = ["什么是", "介绍", "解释", "langgraph", "langchain", "python"]
    if any(keyword in query_lower for keyword in knowledge_keywords):
        return {
            "needs_tool": True,
            "tool_name": "search_knowledge",
            "tool_input": user_query,
            "thought": "检测到知识查询需求，需要搜索知识库",
            "iteration": state.get("iteration", 0)
        }
    
    # 如果不匹配任何工具，直接回答
    prompt = f"请简洁地回答：{user_query}"
    response = llm.invoke(prompt)
    
    return {
        "needs_tool": False,
        "final_answer": response.content,
        "thought": "不需要使用工具，直接回答",
        "iteration": state.get("iteration", 0)
    }

def execute_tool(state: AgentState) -> dict:
    """节点2：执行选定的工具"""
    tool_name = state["tool_name"]
    tool_input = state["tool_input"]
    
    if tool_name in TOOLS:
        tool_func = TOOLS[tool_name]["function"]
        try:
            output = tool_func(tool_input)
            return {"tool_output": output}
        except Exception as e:
            return {"tool_output": f"工具执行错误：{str(e)}"}
    else:
        return {"tool_output": f"未找到工具：{tool_name}"}

def generate_final_answer(state: AgentState) -> dict:
    """节点3：基于工具输出生成最终回答"""
    user_query = state["user_query"]
    tool_output = state.get("tool_output", "")
    tool_name = state.get("tool_name", "")
    
    # 直接使用工具输出作为回答的一部分，确保真实数据被使用
    if tool_name == "get_weather":
        # 天气查询直接返回工具结果
        final_answer = f"根据查询结果：{tool_output}"
    elif tool_name == "calculate":
        # 计算结果直接返回
        final_answer = tool_output
    elif tool_name == "search_knowledge":
        # 知识搜索结果
        final_answer = f"根据知识库：{tool_output}"
    else:
        # 其他情况，用 LLM 生成自然语言回答
        prompt = f"""
        用户问题：{user_query}
        工具返回的真实数据：{tool_output}
        
        请基于工具返回的真实数据，用自然、友好的语言回答用户的问题。
        注意：必须使用工具返回的真实数据，不要编造信息。
        """
        response = llm.invoke(prompt)
        final_answer = response.content
    
    return {"final_answer": final_answer}

def direct_answer(state: AgentState) -> dict:
    """节点4：直接回答（不使用工具的情况）"""
    # 如果已经有 final_answer，直接返回
    if state.get("final_answer"):
        return {}
    
    # 否则生成回答
    user_query = state["user_query"]
    prompt = f"请简洁明了地回答：{user_query}"
    response = llm.invoke(prompt)
    
    return {"final_answer": response.content}

# 6. 定义分支判断函数
def should_use_tool(state: AgentState) -> str:
    """判断是否需要使用工具"""
    # 防止无限循环
    if state.get("iteration", 0) > 3:
        return "direct_answer"
    
    return "execute_tool" if state.get("needs_tool", False) else "direct_answer"

# 7. 构建 StateGraph 工作流
def build_agent_workflow():
    # 初始化状态图
    graph = StateGraph(AgentState)
    
    # 添加工作流节点
    graph.add_node("analyze", analyze_query)
    graph.add_node("execute_tool", execute_tool)
    graph.add_node("generate_answer", generate_final_answer)
    graph.add_node("direct_answer", direct_answer)
    
    # 设置起始节点
    graph.set_entry_point("analyze")
    
    # 添加条件边
    graph.add_conditional_edges(
        source="analyze",
        path=should_use_tool,
        path_map={
            "execute_tool": "execute_tool",
            "direct_answer": "direct_answer"
        }
    )
    
    # 添加普通边
    graph.add_edge("execute_tool", "generate_answer")
    graph.add_edge("generate_answer", END)
    graph.add_edge("direct_answer", END)
    
    # 编译工作流
    return graph.compile()

# 8. 运行示例
def run_examples():
    """运行多个示例查询"""
    agent = build_agent_workflow()
    
    # 测试查询列表
    test_queries = [
        "北京今天天气怎么样？",
        "帮我计算 123 * 456",
        "什么是 LangGraph？",
        "你好，请介绍一下你自己"
    ]
    
    print("=" * 60)
    print("🤖 智能工具调用 Agent 演示")
    print("=" * 60)
    
    for query in test_queries:
        print(f"\n{'='*60}")
        print(f"👤 用户查询：{query}")
        print(f"{'='*60}")
        
        # 运行工作流
        result = agent.invoke({
            "user_query": query,
            "needs_tool": False,
            "iteration": 0
        })
        
        # 显示结果
        if result.get("thought"):
            print(f"💭 思考过程：{result['thought']}")
        
        if result.get("needs_tool"):
            print(f"🔧 使用工具：{result.get('tool_name')}")
            print(f"📥 工具输入：{result.get('tool_input')}")
            print(f"📤 工具输出：{result.get('tool_output')}")
        
        print(f"\n✅ 最终回答：{result['final_answer']}")
    
    print("\n" + "=" * 60)

# 9. 交互式模式
def interactive_agent():
    """交互式工具调用 Agent（支持历史记录和上下键切换）"""
    import readline  # 提供历史记录和行编辑功能
    import os
    
    agent = build_agent_workflow()
    
    # 配置历史记录文件
    history_file = os.path.expanduser("~/.langgraph_agent_history")
    
    # 加载历史记录
    try:
        readline.read_history_file(history_file)
    except FileNotFoundError:
        pass  # 首次运行，历史文件不存在
    
    # 设置历史记录最大条数
    readline.set_history_length(1000)
    
    print("=" * 60)
    print("🤖 智能工具调用 Agent 已启动！")
    print("可用工具：天气查询、数学计算、知识搜索")
    print("💡 提示：使用 ↑↓ 键浏览历史问题")
    print("输入 'quit' 退出")
    print("=" * 60)
    
    try:
        while True:
            try:
                user_query = input("\n👤 你: ").strip()
            except EOFError:
                # 处理 Ctrl+D
                print("\n👋 再见！")
                break
            
            if user_query.lower() in ['quit', 'exit', '退出']:
                print("\n👋 再见！")
                break
            
            if not user_query:
                continue
            
            # 运行工作流
            result = agent.invoke({
                "user_query": user_query,
                "needs_tool": False,
                "iteration": 0
            })
            
            # 显示详细过程
            if result.get("thought"):
                print(f"\n💭 思考：{result['thought']}")
            
            if result.get("needs_tool") and result.get("tool_name"):
                print(f"🔧 调用工具：{result['tool_name']}({result.get('tool_input')})")
                print(f"📤 工具结果：{result.get('tool_output')}")
            
            print(f"\n🤖 回答：{result['final_answer']}")
    
    finally:
        # 保存历史记录
        try:
            readline.write_history_file(history_file)
        except Exception as e:
            print(f"⚠️  保存历史记录失败：{e}")

# 10. 主函数
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "demo":
        # 演示模式
        run_examples()
    else:
        # 交互模式
        interactive_agent()

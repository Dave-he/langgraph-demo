# 1. 导入核心依赖
from langchain_ollama import ChatOllama
from langgraph.graph import StateGraph, END
from typing import TypedDict, List, Optional, Dict
import time

# 2. 初始化本地 Ollama 模型
llm = ChatOllama(
    model="gemma3:12b",
    base_url="http://[240e:305:67ad:5b00:5680:9048:1114:513d]:11434",
    temperature=0.5,
    num_ctx=4096
)

# 3. 定义工作流状态（内容审核与生成流程）
class ContentWorkflowState(TypedDict):
    topic: str  # 内容主题
    draft_content: Optional[str]  # 初稿内容
    review_result: Optional[Dict]  # 审核结果
    revision_count: int  # 修订次数
    final_content: Optional[str]  # 最终内容
    is_approved: bool  # 是否通过审核
    feedback: Optional[str]  # 审核反馈

# 4. 定义工作流节点函数
def generate_draft(state: ContentWorkflowState) -> dict:
    """节点1：生成初稿内容"""
    topic = state["topic"]
    revision_count = state.get("revision_count", 0)
    
    if revision_count == 0:
        # 首次生成
        prompt = f"""
        请围绕主题「{topic}」撰写一篇简短的文章（200-300字）。
        要求：
        1. 内容准确、有价值
        2. 语言流畅、易懂
        3. 结构清晰（引言-正文-结论）
        """
    else:
        # 根据反馈修订
        feedback = state.get("feedback", "")
        draft = state.get("draft_content", "")
        prompt = f"""
        原文：
        {draft}
        
        审核反馈：
        {feedback}
        
        请根据反馈修改文章，保持主题「{topic}」不变。
        """
    
    response = llm.invoke(prompt)
    
    return {
        "draft_content": response.content,
        "revision_count": revision_count
    }

def review_content(state: ContentWorkflowState) -> dict:
    """节点2：审核内容质量"""
    draft = state["draft_content"]
    topic = state["topic"]
    
    prompt = f"""
    请审核以下文章的质量：
    
    主题：{topic}
    文章内容：
    {draft}
    
    审核标准：
    1. 内容是否切题（权重30%）
    2. 信息是否准确完整（权重30%）
    3. 语言是否流畅（权重20%）
    4. 结构是否清晰（权重20%）
    
    请按以下格式返回审核结果（只返回这个格式，不要其他内容）：
    评分：[0-100的整数]
    是否通过：[通过/不通过]
    反馈：[具体的改进建议，如果通过则写"无需修改"]
    """
    
    response = llm.invoke(prompt)
    content = response.content.strip()
    
    # 解析审核结果
    lines = content.split('\n')
    score = 0
    is_approved = False
    feedback = ""
    
    for line in lines:
        if line.startswith("评分"):
            try:
                score = int(''.join(filter(str.isdigit, line)))
            except:
                score = 0
        elif line.startswith("是否通过"):
            is_approved = "通过" in line and "不通过" not in line
        elif line.startswith("反馈"):
            feedback = line.replace("反馈：", "").strip()
    
    return {
        "review_result": {
            "score": score,
            "is_approved": is_approved,
            "feedback": feedback
        },
        "is_approved": is_approved,
        "feedback": feedback
    }

def revise_content(state: ContentWorkflowState) -> dict:
    """节点3：修订内容（增加修订计数）"""
    return {
        "revision_count": state["revision_count"] + 1
    }

def finalize_content(state: ContentWorkflowState) -> dict:
    """节点4：确定最终内容"""
    return {
        "final_content": state["draft_content"]
    }

def reject_content(state: ContentWorkflowState) -> dict:
    """节点5：拒绝内容（超过最大修订次数）"""
    return {
        "final_content": None,
        "feedback": "内容经过多次修订仍未达标，建议重新选择主题或调整方向。"
    }

# 5. 定义分支判断函数
def decide_next_step(state: ContentWorkflowState) -> str:
    """判断下一步操作"""
    is_approved = state.get("is_approved", False)
    revision_count = state.get("revision_count", 0)
    
    # 如果通过审核，进入最终确认
    if is_approved:
        return "finalize"
    
    # 如果修订次数超过3次，拒绝内容
    if revision_count >= 3:
        return "reject"
    
    # 否则继续修订
    return "revise"

# 6. 构建 StateGraph 工作流
def build_content_workflow():
    # 初始化状态图
    graph = StateGraph(ContentWorkflowState)
    
    # 添加工作流节点
    graph.add_node("generate_draft", generate_draft)
    graph.add_node("review_content", review_content)
    graph.add_node("revise", revise_content)
    graph.add_node("finalize", finalize_content)
    graph.add_node("reject", reject_content)
    
    # 设置起始节点
    graph.set_entry_point("generate_draft")
    
    # 添加边
    graph.add_edge("generate_draft", "review_content")
    graph.add_edge("revise", "generate_draft")  # 修订后重新生成
    graph.add_edge("finalize", END)
    graph.add_edge("reject", END)
    
    # 添加条件边（审核后的分支）
    graph.add_conditional_edges(
        source="review_content",
        path=decide_next_step,
        path_map={
            "finalize": "finalize",
            "revise": "revise",
            "reject": "reject"
        }
    )
    
    # 编译工作流
    return graph.compile()

# 7. 可视化工作流执行过程
def visualize_workflow_execution(state: ContentWorkflowState, step: str):
    """可视化当前执行步骤"""
    steps_emoji = {
        "generate_draft": "✍️",
        "review_content": "🔍",
        "revise": "🔄",
        "finalize": "✅",
        "reject": "❌"
    }
    
    print(f"\n{steps_emoji.get(step, '📍')} 当前步骤：{step}")
    print(f"   修订次数：{state.get('revision_count', 0)}")
    
    if step == "review_content" and state.get("review_result"):
        result = state["review_result"]
        print(f"   审核评分：{result.get('score', 0)}/100")
        print(f"   审核结果：{'✅ 通过' if result.get('is_approved') else '❌ 未通过'}")
        print(f"   审核反馈：{result.get('feedback', '')}")

# 8. 运行示例
def run_content_generation(topic: str, verbose: bool = True):
    """运行内容生成工作流"""
    workflow = build_content_workflow()
    
    print("=" * 60)
    print(f"📝 内容生成工作流启动")
    print(f"主题：{topic}")
    print("=" * 60)
    
    # 初始化状态
    initial_state = {
        "topic": topic,
        "revision_count": 0,
        "is_approved": False
    }
    
    # 执行工作流（逐步执行以便可视化）
    if verbose:
        # 手动逐步执行以显示过程
        state = initial_state
        steps = ["generate_draft", "review_content"]
        
        for step in steps:
            if step == "generate_draft":
                result = generate_draft(state)
                state.update(result)
                visualize_workflow_execution(state, step)
                print(f"\n📄 生成的内容：\n{state['draft_content'][:200]}...")
                time.sleep(1)
            
            elif step == "review_content":
                result = review_content(state)
                state.update(result)
                visualize_workflow_execution(state, step)
                time.sleep(1)
                
                # 判断下一步
                next_step = decide_next_step(state)
                
                if next_step == "finalize":
                    result = finalize_content(state)
                    state.update(result)
                    visualize_workflow_execution(state, "finalize")
                    break
                elif next_step == "reject":
                    result = reject_content(state)
                    state.update(result)
                    visualize_workflow_execution(state, "reject")
                    break
                else:
                    # 继续修订循环
                    max_revisions = 3
                    while state["revision_count"] < max_revisions:
                        result = revise_content(state)
                        state.update(result)
                        visualize_workflow_execution(state, "revise")
                        time.sleep(1)
                        
                        # 重新生成
                        result = generate_draft(state)
                        state.update(result)
                        visualize_workflow_execution(state, "generate_draft")
                        print(f"\n📄 修订后的内容：\n{state['draft_content'][:200]}...")
                        time.sleep(1)
                        
                        # 重新审核
                        result = review_content(state)
                        state.update(result)
                        visualize_workflow_execution(state, "review_content")
                        time.sleep(1)
                        
                        # 再次判断
                        next_step = decide_next_step(state)
                        if next_step == "finalize":
                            result = finalize_content(state)
                            state.update(result)
                            visualize_workflow_execution(state, "finalize")
                            break
                        elif next_step == "reject":
                            result = reject_content(state)
                            state.update(result)
                            visualize_workflow_execution(state, "reject")
                            break
        
        final_state = state
    else:
        # 直接执行完整工作流
        final_state = workflow.invoke(initial_state)
    
    # 显示最终结果
    print("\n" + "=" * 60)
    print("📊 工作流执行完成")
    print("=" * 60)
    print(f"总修订次数：{final_state['revision_count']}")
    print(f"最终状态：{'✅ 通过审核' if final_state.get('is_approved') else '❌ 未通过审核'}")
    
    if final_state.get("final_content"):
        print(f"\n✅ 最终内容：\n{final_state['final_content']}")
    else:
        print(f"\n❌ 内容生成失败")
        print(f"原因：{final_state.get('feedback', '未知')}")
    
    print("\n" + "=" * 60)
    
    return final_state

# 9. 批量测试多个主题
def batch_test():
    """批量测试多个主题"""
    topics = [
        "人工智能在医疗领域的应用",
        "可持续发展与环境保护",
        "远程办公的优势与挑战"
    ]
    
    print("🚀 批量内容生成测试")
    print("=" * 60)
    
    results = []
    for i, topic in enumerate(topics, 1):
        print(f"\n\n{'#'*60}")
        print(f"测试 {i}/{len(topics)}")
        print(f"{'#'*60}")
        
        result = run_content_generation(topic, verbose=False)
        results.append({
            "topic": topic,
            "success": result.get("is_approved", False),
            "revisions": result.get("revision_count", 0)
        })
        
        time.sleep(2)  # 避免请求过快
    
    # 汇总统计
    print("\n\n" + "=" * 60)
    print("📈 批量测试统计")
    print("=" * 60)
    
    for i, result in enumerate(results, 1):
        status = "✅ 成功" if result["success"] else "❌ 失败"
        print(f"{i}. {result['topic']}")
        print(f"   状态：{status} | 修订次数：{result['revisions']}")
    
    success_rate = sum(1 for r in results if r["success"]) / len(results) * 100
    avg_revisions = sum(r["revisions"] for r in results) / len(results)
    
    print(f"\n总体成功率：{success_rate:.1f}%")
    print(f"平均修订次数：{avg_revisions:.1f}")
    print("=" * 60)

# 10. 交互式主题输入模式
def interactive_content_generation():
    """交互式内容生成（支持历史记录和上下键切换）"""
    import readline  # 提供历史记录和行编辑功能
    import os
    
    # 配置历史记录文件
    history_file = os.path.expanduser("~/.langgraph_content_history")
    
    # 加载历史记录
    try:
        readline.read_history_file(history_file)
    except FileNotFoundError:
        pass  # 首次运行，历史文件不存在
    
    # 设置历史记录最大条数
    readline.set_history_length(1000)
    
    print("=" * 60)
    print("📝 智能内容生成系统已启动！")
    print("💡 提示：使用 ↑↓ 键浏览历史主题")
    print("输入 'quit' 退出")
    print("=" * 60)
    
    try:
        while True:
            try:
                topic = input("\n👤 请输入内容主题: ").strip()
            except EOFError:
                # 处理 Ctrl+D
                print("\n👋 再见！")
                break
            
            if topic.lower() in ['quit', 'exit', '退出']:
                print("\n👋 再见！")
                break
            
            if not topic:
                continue
            
            # 运行内容生成工作流
            run_content_generation(topic, verbose=True)
            
            print("\n" + "=" * 60)
    
    finally:
        # 保存历史记录
        try:
            readline.write_history_file(history_file)
        except Exception as e:
            print(f"⚠️  保存历史记录失败：{e}")

# 11. 主函数
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "batch":
            # 批量测试模式
            batch_test()
        elif sys.argv[1] == "interactive":
            # 交互模式
            interactive_content_generation()
        else:
            # 自定义主题
            topic = " ".join(sys.argv[1:])
            run_content_generation(topic, verbose=True)
    else:
        # 默认交互模式
        interactive_content_generation()

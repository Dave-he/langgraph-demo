# LangGraph Demo 示例集合

本项目包含多个 LangGraph 使用示例，展示了如何使用 LangGraph 构建不同类型的 AI 应用。

## 📋 目录

- [环境准备](#环境准备)
- [示例列表](#示例列表)
- [运行方法](#运行方法)
- [示例详解](#示例详解)

## 🔧 环境准备

### 1. 安装 Ollama

确保本地已安装并运行 Ollama 服务：

```bash
# 检查 Ollama 是否运行
ollama list

# 拉取所需模型（推荐使用 gemma3:4b）
ollama pull gemma3:4b
```

### 2. 安装 Python 依赖

```bash
# 安装 LangChain 和 LangGraph
pip install langchain-ollama langgraph langchain-core
```

### 3. 配置模型地址

如果你的 Ollama 服务不在默认地址（localhost:11434），请修改各示例文件中的 `base_url` 参数。

## 📚 示例列表

| 示例文件 | 功能描述 | 难度 | 特色功能 |
|---------|---------|------|---------|
| `01_ollama-chat.py` | 基础问答工作流 | ⭐ | 质量检查、自动优化 |
| `02_multi_turn_chat.py` | 多轮对话系统 | ⭐⭐ | 对话历史、自动摘要 |
| `03_tool_calling_agent.py` | 工具调用 Agent | ⭐⭐⭐ | 智能工具选择、函数调用 |
| `04_content_review_workflow.py` | 内容审核工作流 | ⭐⭐⭐ | 迭代优化、可视化流程 |

## 🚀 运行方法

### 示例 1：基础问答工作流

```bash
cd python
python 01_ollama-chat.py
```

**功能说明：**
- 自动生成初步回答
- 质量检查与评估
- 不合格自动优化
- 输出最终答案

### 示例 2：多轮对话系统

```bash
# 交互模式（推荐）
python 02_multi_turn_chat.py

# 测试模式
python 02_multi_turn_chat.py test
```

**功能说明：**
- 支持连续多轮对话
- 自动维护对话历史
- 每 5 轮自动生成摘要
- 输入 `summary` 查看对话摘要
- 输入 `quit` 退出对话

**交互示例：**
```
👤 你: 你好，请介绍一下 LangGraph
🤖 AI: [AI 的回复]

👤 你: 它和 LangChain 有什么区别？
🤖 AI: [AI 的回复]

👤 你: summary
📝 对话摘要：[自动生成的摘要]
```

### 示例 3：工具调用 Agent

```bash
# 交互模式（推荐）
python 03_tool_calling_agent.py

# 演示模式
python 03_tool_calling_agent.py demo
```

**功能说明：**
- 智能判断是否需要使用工具
- 支持多种工具：天气查询、数学计算、知识搜索
- 自动选择合适的工具
- 基于工具结果生成自然语言回答

**可用工具：**
1. **天气查询**：`get_weather(city)` - 查询指定城市天气
2. **数学计算**：`calculate(expression)` - 计算数学表达式
3. **知识搜索**：`search_knowledge(query)` - 搜索知识库

**交互示例：**
```
👤 你: 北京今天天气怎么样？
💭 思考：需要查询天气信息
🔧 调用工具：get_weather(北京)
📤 工具结果：晴天，温度 15-25°C，空气质量良好
🤖 回答：北京今天是晴天，温度在15-25°C之间...

👤 你: 帮我计算 123 * 456
💭 思考：需要进行数学计算
🔧 调用工具：calculate(123 * 456)
📤 工具结果：计算结果：123 * 456 = 56088
🤖 回答：123 乘以 456 等于 56088
```

### 示例 4：内容审核工作流

```bash
# 默认示例
python 04_content_review_workflow.py

# 自定义主题
python 04_content_review_workflow.py "人工智能的未来发展"

# 批量测试模式
python 04_content_review_workflow.py batch
```

**功能说明：**
- 自动生成内容初稿
- 多维度质量审核（切题性、准确性、流畅性、结构性）
- 不合格自动修订（最多 3 次）
- 实时可视化执行流程
- 支持批量测试多个主题

**工作流程：**
```
生成初稿 → 质量审核 → 判断
                      ├─ 通过 → 输出最终内容
                      ├─ 未通过 → 修订 → 重新生成 → 质量审核
                      └─ 超过3次 → 拒绝内容
```

**输出示例：**
```
✍️ 当前步骤：generate_draft
   修订次数：0
📄 生成的内容：
[初稿内容...]

🔍 当前步骤：review_content
   修订次数：0
   审核评分：75/100
   审核结果：❌ 未通过
   审核反馈：内容需要补充更多具体案例

🔄 当前步骤：revise
   修订次数：1

✍️ 当前步骤：generate_draft
   修订次数：1
📄 修订后的内容：
[修订后的内容...]

🔍 当前步骤：review_content
   修订次数：1
   审核评分：85/100
   审核结果：✅ 通过
   审核反馈：无需修改

✅ 当前步骤：finalize
   修订次数：1
```

## 🎯 示例详解

### 1. 基础问答工作流 (01_ollama-chat.py)

**核心概念：**
- StateGraph 状态管理
- 条件分支（Conditional Edges）
- 节点函数定义
- 工作流编译与执行

**适用场景：**
- 需要质量保证的问答系统
- 自动内容优化
- 多步骤决策流程

### 2. 多轮对话系统 (02_multi_turn_chat.py)

**核心概念：**
- 对话历史管理
- 消息类型（HumanMessage, AIMessage）
- 上下文窗口控制
- 定期摘要生成

**适用场景：**
- 客服机器人
- 智能助手
- 教育辅导系统
- 长对话场景

**技术亮点：**
- 自动维护对话上下文
- 智能摘要防止上下文溢出
- 支持无限轮对话

### 3. 工具调用 Agent (03_tool_calling_agent.py)

**核心概念：**
- 工具注册与管理
- 智能工具选择
- JSON 格式解析
- 函数调用封装

**适用场景：**
- 需要外部数据的应用
- API 集成
- 多功能助手
- 自动化任务执行

**技术亮点：**
- 自动判断是否需要工具
- 支持多种工具类型
- 可扩展的工具系统
- 自然语言结果生成

**扩展方法：**
```python
# 添加新工具
def your_custom_tool(param: str) -> str:
    """你的工具描述"""
    # 实现你的逻辑
    return result

# 注册到 TOOLS
TOOLS["your_tool"] = {
    "function": your_custom_tool,
    "description": "工具描述",
    "parameters": {"param": "参数说明"}
}
```

### 4. 内容审核工作流 (04_content_review_workflow.py)

**核心概念：**
- 循环工作流
- 迭代优化
- 多维度评估
- 流程可视化

**适用场景：**
- 内容生成平台
- 自动写作助手
- 质量控制系统
- 文档审核流程

**技术亮点：**
- 自动质量评分
- 智能反馈生成
- 防止无限循环（最大迭代次数）
- 实时流程可视化
- 支持批量处理

**评分标准：**
- 切题性（30%）
- 准确性（30%）
- 流畅性（20%）
- 结构性（20%）

## 🔍 核心概念对比

| 概念 | 01 基础问答 | 02 多轮对话 | 03 工具调用 | 04 内容审核 |
|------|-----------|-----------|-----------|-----------|
| 状态管理 | ✅ 简单状态 | ✅ 消息列表 | ✅ 复杂状态 | ✅ 迭代状态 |
| 条件分支 | ✅ 质量判断 | ❌ 线性流程 | ✅ 工具判断 | ✅ 审核判断 |
| 循环流程 | ✅ 优化循环 | ❌ | ❌ | ✅ 修订循环 |
| 外部调用 | ❌ | ❌ | ✅ 工具函数 | ❌ |
| 交互模式 | ❌ | ✅ | ✅ | ❌ |

## 💡 最佳实践

### 1. 模型选择
- 简单任务：`gemma3:1b` 或 `gemma3:4b`
- 复杂任务：`gemma3:12b` 或更大模型
- 根据本地资源调整

### 2. 温度参数
- 事实性任务：0.1 - 0.3（更精确）
- 创意性任务：0.5 - 0.8（更多样）
- 对话场景：0.5 - 0.7（平衡）

### 3. 上下文窗口
- 短对话：2048
- 长对话：4096 - 8192
- 文档处理：8192+

### 4. 错误处理
- 添加 try-except 捕获异常
- 设置最大迭代次数防止死循环
- 验证 JSON 解析结果
- 提供降级方案

### 5. 性能优化
- 批量请求时添加延迟
- 缓存常用结果
- 控制上下文长度
- 使用流式输出（大模型）

## 🐛 常见问题

### Q1: 模型未找到错误
```
Error: model 'xxx' not found
```
**解决方法：**
```bash
# 查看已安装模型
ollama list

# 拉取所需模型
ollama pull gemma3:4b
```

### Q2: 连接超时
```
Error: connection timeout
```
**解决方法：**
- 检查 Ollama 服务是否运行
- 确认 `base_url` 配置正确
- 检查防火墙设置

### Q3: JSON 解析失败
```
JSONDecodeError: Expecting value
```
**解决方法：**
- 降低模型温度（提高输出稳定性）
- 在 prompt 中明确要求 JSON 格式
- 添加 try-except 处理异常
- 使用更大的模型

### Q4: 内存不足
```
Error: out of memory
```
**解决方法：**
- 使用更小的模型
- 减小 `num_ctx` 参数
- 清理对话历史
- 关闭其他占用内存的程序

## 📖 学习路径

1. **入门**：先运行 `01_ollama-chat.py`，理解基本的 StateGraph 概念
2. **进阶**：尝试 `02_multi_turn_chat.py`，学习状态管理和交互
3. **高级**：研究 `03_tool_calling_agent.py`，掌握工具集成
4. **实战**：运行 `04_content_review_workflow.py`，理解复杂工作流

## 🔗 相关资源

- [LangGraph 官方文档](https://langchain-ai.github.io/langgraph/)
- [LangChain 官方文档](https://python.langchain.com/)
- [Ollama 官方网站](https://ollama.ai/)

## 📝 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**Happy Coding! 🎉**

# LangGraph Demo 示例集合

这是一个 LangGraph 学习和实践项目，包含多个不同场景的示例代码，帮助你快速掌握 LangGraph 的核心概念和实际应用。

## 🌟 项目特色

- ✅ **完整示例**：从基础到高级，涵盖多种应用场景
- ✅ **本地运行**：基于 Ollama，无需 API Key，完全本地化
- ✅ **详细注释**：每行代码都有清晰的中文注释
- ✅ **交互体验**：多个示例支持交互式运行
- ✅ **双语言支持**：提供 Python 和 TypeScript 版本

## 📁 项目结构

```
langgraph-demo/
├── python/                          # Python 示例
│   ├── 01_ollama-chat.py           # 基础问答工作流
│   ├── 02_multi_turn_chat.py       # 多轮对话系统 ⭐ 新增
│   ├── 03_tool_calling_agent.py    # 工具调用 Agent ⭐ 新增
│   ├── 04_content_review_workflow.py # 内容审核工作流 ⭐ 新增
│   └── README.md                    # Python 示例详细文档
├── typescript/                      # TypeScript 示例
│   ├── ollama-chat.ts              # 基础问答工作流
│   ├── package.json
│   └── tsconfig.json
└── README.md                        # 项目总览（本文件）
```

## 🚀 快速开始

### 1. 环境准备

#### 安装 Ollama

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# 从 https://ollama.ai/download 下载安装包
```

#### 启动 Ollama 服务

```bash
# 启动服务
ollama serve

# 拉取模型（推荐使用 gemma3:4b）
ollama pull gemma3:4b
```

### 2. Python 环境配置

```bash
# 安装依赖
pip install langchain-ollama langgraph langchain-core

# 进入 Python 目录
cd python

# 运行示例
python 02_multi_turn_chat.py
```

### 3. TypeScript 环境配置

```bash
# 进入 TypeScript 目录
cd typescript

# 安装依赖
pnpm install

# 运行示例
pnpm run dev
```

## 📚 示例概览

### Python 示例

| 示例 | 文件 | 功能 | 难度 | 特色 |
|------|------|------|------|------|
| 1️⃣ | `01_ollama-chat.py` | 基础问答工作流 | ⭐ | 质量检查、自动优化 |
| 2️⃣ | `02_multi_turn_chat.py` | 多轮对话系统 | ⭐⭐ | 对话历史、自动摘要、交互式 |
| 3️⃣ | `03_tool_calling_agent.py` | 工具调用 Agent | ⭐⭐⭐ | 智能工具选择、函数调用 |
| 4️⃣ | `04_content_review_workflow.py` | 内容审核工作流 | ⭐⭐⭐ | 迭代优化、可视化流程 |

### TypeScript 示例

| 示例 | 文件 | 功能 | 难度 |
|------|------|------|------|
| 1️⃣ | `ollama-chat.ts` | 基础问答工作流 | ⭐ |

## 🎯 示例详解

### 示例 1：基础问答工作流

**适用场景**：需要质量保证的问答系统

```bash
python python/01_ollama-chat.py
```

**核心特性**：
- ✅ 自动生成初步回答
- ✅ 质量检查与评估
- ✅ 不合格自动优化
- ✅ 输出最终答案

### 示例 2：多轮对话系统 ⭐ 推荐

**适用场景**：客服机器人、智能助手、教育辅导

```bash
# 交互模式
python python/02_multi_turn_chat.py

# 测试模式
python python/02_multi_turn_chat.py test
```

**核心特性**：
- ✅ 支持连续多轮对话
- ✅ 自动维护对话历史
- ✅ 每 5 轮自动生成摘要
- ✅ 交互式命令（summary、quit）

**交互示例**：
```
🤖 多轮对话机器人已启动！
提示：输入 'quit' 或 'exit' 退出对话
提示：输入 'summary' 查看对话摘要
============================================================

👤 你: 你好，请介绍一下 LangGraph
🤖 AI: LangGraph 是一个用于构建有状态、多参与者应用程序的库...

👤 你: 它和 LangChain 有什么区别？
🤖 AI: LangGraph 相比 LangChain 的主要区别在于...

👤 你: summary
📝 对话摘要：用户询问了 LangGraph 的基本概念和与 LangChain 的区别...
```

### 示例 3：工具调用 Agent ⭐ 推荐

**适用场景**：需要外部数据的应用、API 集成、多功能助手

```bash
# 交互模式
python python/03_tool_calling_agent.py

# 演示模式
python python/03_tool_calling_agent.py demo
```

**核心特性**：
- ✅ 智能判断是否需要使用工具
- ✅ 支持多种工具（天气、计算、搜索）
- ✅ 自动选择合适的工具
- ✅ 自然语言结果生成

**可用工具**：
1. **天气查询**：查询指定城市天气
2. **数学计算**：计算数学表达式
3. **知识搜索**：搜索知识库

**交互示例**：
```
🤖 智能工具调用 Agent 已启动！
可用工具：天气查询、数学计算、知识搜索
============================================================

👤 你: 北京今天天气怎么样？
💭 思考：需要查询天气信息
🔧 调用工具：get_weather(北京)
📤 工具结果：晴天，温度 15-25°C，空气质量良好
🤖 回答：北京今天是晴天，温度在15-25°C之间，空气质量良好...

👤 你: 帮我计算 123 * 456
💭 思考：需要进行数学计算
🔧 调用工具：calculate(123 * 456)
📤 工具结果：计算结果：123 * 456 = 56088
🤖 回答：123 乘以 456 等于 56088
```

### 示例 4：内容审核工作流

**适用场景**：内容生成平台、自动写作助手、质量控制

```bash
# 默认示例
python python/04_content_review_workflow.py

# 自定义主题
python python/04_content_review_workflow.py "人工智能的未来发展"

# 批量测试
python python/04_content_review_workflow.py batch
```

**核心特性**：
- ✅ 自动生成内容初稿
- ✅ 多维度质量审核（切题性、准确性、流畅性、结构性）
- ✅ 不合格自动修订（最多 3 次）
- ✅ 实时可视化执行流程
- ✅ 支持批量测试

**工作流程**：
```
生成初稿 → 质量审核 → 判断
                      ├─ 通过 → 输出最终内容
                      ├─ 未通过 → 修订 → 重新生成
                      └─ 超过3次 → 拒绝内容
```

## 🎓 学习路径

```
第1步：基础概念
└─ 运行 01_ollama-chat.py
   └─ 理解 StateGraph、节点、边的概念

第2步：状态管理
└─ 运行 02_multi_turn_chat.py
   └─ 学习复杂状态管理和交互

第3步：工具集成
└─ 运行 03_tool_calling_agent.py
   └─ 掌握外部工具调用

第4步：复杂工作流
└─ 运行 04_content_review_workflow.py
   └─ 理解循环和迭代优化
```

## 💡 核心概念

### StateGraph（状态图）
LangGraph 的核心抽象，用于定义工作流的状态和转换。

```python
from langgraph.graph import StateGraph, END

# 定义状态
class MyState(TypedDict):
    input: str
    output: str

# 创建状态图
graph = StateGraph(MyState)
```

### 节点（Nodes）
工作流中的处理单元，每个节点是一个函数。

```python
def my_node(state: MyState) -> dict:
    # 处理逻辑
    return {"output": "processed"}

graph.add_node("my_node", my_node)
```

### 边（Edges）
连接节点的路径，定义工作流的执行顺序。

```python
# 普通边
graph.add_edge("node1", "node2")

# 条件边
graph.add_conditional_edges(
    "node1",
    decide_function,
    {"path1": "node2", "path2": "node3"}
)
```

## 🔧 配置说明

### 模型配置

```python
llm = ChatOllama(
    model="gemma3:4b",           # 模型名称
    base_url="http://localhost:11434",  # Ollama 服务地址
    temperature=0.7,              # 温度（0-1，越高越随机）
    num_ctx=4096                  # 上下文窗口大小
)
```

### 温度参数建议

| 任务类型 | 推荐温度 | 说明 |
|---------|---------|------|
| 事实性问答 | 0.1 - 0.3 | 更精确、更确定 |
| 对话交互 | 0.5 - 0.7 | 平衡准确性和多样性 |
| 创意写作 | 0.7 - 0.9 | 更有创意、更多样 |

### 上下文窗口建议

| 场景 | 推荐大小 | 说明 |
|------|---------|------|
| 短对话 | 2048 | 节省资源 |
| 长对话 | 4096 - 8192 | 支持更多历史 |
| 文档处理 | 8192+ | 处理长文本 |

## 🐛 常见问题

### Q1: 模型未找到

```bash
# 查看已安装模型
ollama list

# 拉取模型
ollama pull gemma3:4b
```

### Q2: 连接超时

检查 Ollama 服务是否运行：
```bash
# 检查服务状态
ps aux | grep ollama

# 启动服务
ollama serve
```

### Q3: 内存不足

- 使用更小的模型（如 `gemma3:1b`）
- 减小 `num_ctx` 参数
- 清理对话历史

### Q4: JSON 解析失败

- 降低温度参数（提高稳定性）
- 在 prompt 中明确要求 JSON 格式
- 添加异常处理

## 📖 更多资源

- [LangGraph 官方文档](https://langchain-ai.github.io/langgraph/)
- [LangChain 官方文档](https://python.langchain.com/)
- [Ollama 官方网站](https://ollama.ai/)
- [Python 示例详细文档](./python/README.md)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

如果你有好的示例想法，欢迎贡献：
1. Fork 本项目
2. 创建你的特性分支
3. 提交你的修改
4. 推送到分支
5. 创建 Pull Request

## 📝 许可证

MIT License

## ⭐ Star History

如果这个项目对你有帮助，欢迎 Star ⭐

---

**Happy Coding! 🎉**

*Made with ❤️ by LangGraph Community*

# LangGraph TypeScript Demo 示例集合

本项目包含多个 LangGraph TypeScript 使用示例，展示了如何使用 LangGraph 构建不同类型的 AI 应用。

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

### 2. 安装依赖

```bash
cd typescript
pnpm install
# 或使用 npm
npm install
```

### 3. 配置模型地址

如果你的 Ollama 服务不在默认地址（localhost:11434），请修改各示例文件中的 `baseUrl` 参数。

## 📚 示例列表

| 示例文件 | 功能描述 | 难度 | 特色功能 |
|---------|---------|------|---------|
| `ollama-chat.ts` | 基础问答工作流 | ⭐ | 质量检查、自动优化 |
| `multi-turn-chat.ts` | 多轮对话系统 | ⭐⭐ | 对话历史、自动摘要 |
| `tool-calling-agent.ts` | 工具调用 Agent | ⭐⭐⭐ | 智能工具选择、函数调用 |
| `content-review-workflow.ts` | 内容审核工作流 | ⭐⭐⭐ | 迭代优化、可视化流程 |

## 🚀 运行方法

### 示例 1：基础问答工作流

```bash
pnpm run dev
# 或
npm run dev
```

**功能说明：**
- 自动生成初步回答
- 质量检查与评估
- 不合格自动优化
- 输出最终答案

### 示例 2：多轮对话系统

```bash
# 交互模式（推荐）
pnpm run chat
# 或
npm run chat

# 测试模式
pnpm run chat:test
# 或
npm run chat:test
```

**功能说明：**
- 支持连续多轮对话
- 自动维护对话历史
- 每 5 轮自动生成摘要
- 输入 `summary` 查看对话摘要
- 输入 `quit` 退出对话
- 支持上下键浏览历史输入

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
pnpm run agent
# 或
npm run agent

# 演示模式
pnpm run agent:demo
# 或
npm run agent:demo
```

**功能说明：**
- 智能识别用户意图
- 自动选择合适的工具
- 支持天气查询、数学计算、知识搜索
- 显示完整的思考和执行过程
- 支持上下键浏览历史输入

**可用工具：**
1. **天气查询** - 查询指定城市的天气信息
2. **数学计算** - 计算数学表达式
3. **知识搜索** - 搜索内置知识库

**交互示例：**
```
👤 你: 北京今天天气怎么样？
💭 思考：检测到天气查询，需要查询北京的天气信息
🔧 调用工具：get_weather(北京)
📤 工具结果：晴天，温度 15-25°C，空气质量良好
🤖 回答：根据查询结果：晴天，温度 15-25°C，空气质量良好

👤 你: 帮我计算 123 * 456
💭 思考：检测到数学计算需求，需要计算表达式：123 * 456
🔧 调用工具：calculate(123 * 456)
📤 工具结果：计算结果：123 * 456 = 56088
🤖 回答：计算结果：123 * 456 = 56088
```

### 示例 4：内容审核工作流

```bash
# 交互模式（推荐）
pnpm run content
# 或
npm run content

# 批量测试模式
pnpm run content:batch
# 或
npm run content:batch
```

**功能说明：**
- 根据主题自动生成内容
- 多维度质量审核（切题性、准确性、流畅性、结构）
- 不合格自动修订（最多3次）
- 可视化执行流程
- 支持批量测试多个主题
- 支持上下键浏览历史主题

**工作流程：**
1. 📝 生成初稿
2. 🔍 质量审核
3. 🔄 修订优化（如需要）
4. ✅ 最终确认 / ❌ 拒绝

**交互示例：**
```
👤 请输入内容主题: 人工智能在医疗领域的应用

✍️ 当前步骤：generate_draft
   修订次数：0
📄 生成的内容：...

🔍 当前步骤：review_content
   修订次数：0
   审核评分：85/100
   审核结果：✅ 通过
   审核反馈：无需修改

✅ 当前步骤：finalize

📊 工作流执行完成
总修订次数：0
最终状态：✅ 通过审核
✅ 最终内容：[完整内容]
```

## 💡 使用技巧

### 历史记录功能

所有交互式示例都支持历史记录功能：
- 使用 **↑** 键查看上一条输入
- 使用 **↓** 键查看下一条输入
- 历史记录自动保存在用户主目录下
- 最多保存 1000 条历史记录

### 退出方式

所有交互式示例支持多种退出方式：
- 输入 `quit` 或 `exit` 或 `退出`
- 按 `Ctrl+C` 或 `Ctrl+D`

### 模型配置

如需更换模型，修改各文件中的模型配置：

```typescript
const llm = new ChatOllama({
  model: "gemma3:4b",  // 修改为你的模型名称
  baseUrl: "http://localhost:11434",  // 修改为你的 Ollama 地址
  temperature: 0.7,  // 调整温度参数
  numCtx: 4096,  // 调整上下文窗口
});
```

## 🔧 开发说明

### 项目结构

```
typescript/
├── ollama-chat.ts              # 基础问答工作流
├── multi-turn-chat.ts          # 多轮对话系统
├── tool-calling-agent.ts       # 工具调用 Agent
├── content-review-workflow.ts  # 内容审核工作流
├── package.json                # 项目配置
├── tsconfig.json               # TypeScript 配置
└── README.md                   # 本文档
```

### 构建项目

```bash
# 编译 TypeScript
pnpm run build
# 或
npm run build

# 运行编译后的文件
pnpm start
# 或
npm start
```

## 📖 核心概念

### StateGraph

LangGraph 的核心是 `StateGraph`，它允许你定义：
- **状态（State）**：工作流中的数据结构
- **节点（Node）**：执行特定任务的函数
- **边（Edge）**：节点之间的连接关系
- **条件边（Conditional Edge）**：基于状态的动态路由

### 工作流模式

1. **线性流程**：节点按顺序执行（如基础问答）
2. **条件分支**：根据状态动态选择路径（如质量检查）
3. **循环流程**：节点可以循环执行（如内容修订）
4. **并行处理**：多个节点同时执行（高级用法）

## 🐛 常见问题

### 1. Ollama 连接失败

**错误信息：** `Error: connect ECONNREFUSED`

**解决方案：**
- 确保 Ollama 服务正在运行：`ollama list`
- 检查 `baseUrl` 配置是否正确
- 如果使用 IPv6，确保格式正确：`http://[::1]:11434`

### 2. 模型未找到

**错误信息：** `model 'xxx' not found`

**解决方案：**
- 检查本地已安装的模型：`ollama list`
- 拉取所需模型：`ollama pull gemma3:4b`
- 修改代码中的模型名称

### 3. TypeScript 编译错误

**解决方案：**
```bash
# 清理并重新安装依赖
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 或使用 npm
rm -rf node_modules package-lock.json
npm install
```

## 🎯 下一步

- 尝试修改工作流逻辑，添加自定义节点
- 集成真实的 API（如天气 API、搜索 API）
- 探索更复杂的工作流模式
- 添加持久化存储（如数据库）
- 实现多 Agent 协作

## 📚 相关资源

- [LangGraph 官方文档](https://langchain-ai.github.io/langgraphjs/)
- [LangChain TypeScript 文档](https://js.langchain.com/)
- [Ollama 官方文档](https://ollama.ai/)

## 📝 许可证

MIT License

---

**提示：** 如有问题或建议，欢迎提交 Issue 或 Pull Request！

# LangGraph Ollama Demo (TypeScript)

这是一个使用 TypeScript 实现的 LangGraph + Ollama 本地大模型调用示例。

## 功能说明

该项目实现了一个智能问答工作流，包含以下节点：
1. **生成初步回答** - 根据用户问题生成初步答案
2. **校验回答质量** - 检查回答是否满足质量标准
3. **优化回答** - 对不合格的回答进行优化
4. **生成最终回答** - 输出最终结果

## 环境要求

- Node.js >= 18
- 本地运行的 Ollama 服务
- 已下载的 Ollama 模型（如 gemma3:12b）

## 安装步骤

1. 安装依赖：
```bash
npm install
```

2. 确保 Ollama 服务正在运行：
```bash
# 检查 Ollama 是否运行
curl http://localhost:11434/api/tags
```

3. 修改配置（如需要）：
   - 打开 `ollama-chat.ts`
   - 修改 `baseUrl` 为你的 Ollama 服务地址
   - 修改 `model` 为你已下载的模型名称

## 运行方式

### 开发模式（推荐）
```bash
npm run dev
```

### 编译后运行
```bash
npm run build
npm start
```

## 项目结构

```
.
├── ollama-chat.ts      # TypeScript 主文件
├── ollama-chat.py      # Python 原始版本（参考）
├── package.json        # 项目配置
├── tsconfig.json       # TypeScript 配置
└── README.md          # 项目说明
```

## 注意事项

1. 确保 Ollama 服务地址配置正确
2. 模型名称需要与本地已下载的模型匹配
3. 如果使用 IPv6 地址，需要用方括号包裹，如：`http://[::1]:11434`

## 自定义问题

修改 `ollama-chat.ts` 中的 `userQuestion` 变量即可测试不同的问题。

# Playwright 自动化测试 - 快速开始指南

## 🎯 项目概述

本项目为 LangGraph Demo 提供了完整的 Playwright 自动化测试解决方案，包含：

- ✅ **Web 自动化测试** - 搜索引擎、表单、页面导航
- ✅ **API 测试** - LangGraph/Ollama API 接口测试
- ✅ **E2E 测试** - 端到端用户场景测试
- ✅ **移动端测试** - 响应式设计和移动端交互
- ✅ **集成测试** - LangGraph 应用功能验证

## 📦 安装步骤

### 1. 安装依赖

```bash
cd typescript
pnpm install
```

### 2. 安装 Playwright 浏览器

```bash
pnpm test:install
```

这会安装 Chromium、Firefox 和 WebKit 浏览器及其依赖。

## 🚀 运行测试

### 基础命令

```bash
# 运行所有测试
pnpm test

# 以 UI 模式运行（推荐用于开发）
pnpm test:ui

# 以有头模式运行（可以看到浏览器）
pnpm test:headed

# 调试模式（逐步执行）
pnpm test:debug
```

### 运行特定测试套件

```bash
# Web 自动化测试
pnpm test:web

# LangGraph API 测试（需要 Ollama 服务运行）
pnpm test:api

# 集成测试
pnpm test:integration

# E2E 端到端测试
pnpm test:e2e

# 移动端测试
pnpm test:mobile
```

### 运行特定浏览器

```bash
# 仅 Chromium
pnpm test:chromium

# 仅 Firefox
pnpm test:firefox

# 仅 WebKit (Safari)
pnpm test:webkit
```

## 📊 查看测试报告

测试完成后，查看详细报告：

```bash
pnpm test:report
```

这会在浏览器中打开 HTML 测试报告，包含：
- 测试执行结果
- 失败测试的截图
- 视频录制（如果有）
- 执行追踪信息

## 📁 测试文件说明

### 1. `web-automation.spec.ts`
**基础 Web 自动化测试**

测试内容：
- 搜索引擎（百度、Google、DuckDuckGo）
- 表单填写和提交
- GitHub 仓库浏览
- 页面滚动和导航
- 网络请求监听和模拟

适用场景：学习 Playwright 基础操作

### 2. `langgraph-api.spec.ts`
**LangGraph API 测试**

测试内容：
- Ollama 服务连接
- 文本生成接口
- 聊天对话接口
- 多轮对话上下文
- 工具调用功能
- 性能和并发测试
- 错误处理

⚠️ **前置条件**：需要先启动 Ollama 服务
```bash
ollama serve
```

### 3. `langgraph-integration.spec.ts`
**LangGraph 集成测试**

测试内容：
- 项目文件结构验证
- 依赖配置检查
- Ollama 服务状态
- 模型可用性验证
- 对话功能测试
- 性能基准测试
- 边界条件测试

适用场景：验证 LangGraph 应用的完整性

### 4. `e2e-scenarios.spec.ts`
**E2E 端到端测试**

测试内容：
- 电商购物流程（Amazon）
- 社交媒体交互（Twitter、Reddit）
- 新闻网站浏览（BBC、HackerNews）
- 视频平台（YouTube）
- 文档网站导航（Playwright、MDN）
- 复杂交互（拖拽、文件上传、键盘快捷键）

适用场景：模拟真实用户行为

### 5. `mobile-testing.spec.ts`
**移动端测试**

测试内容：
- 响应式布局测试
- 触摸手势操作
- 不同设备尺寸
- 横屏/竖屏模式
- 移动端性能
- 地理位置模拟
- 离线模式测试

适用场景：移动端兼容性测试

## 🎓 测试示例

### 示例 1：简单的页面测试

```typescript
import { test, expect } from '@playwright/test';

test('访问 Google 并搜索', async ({ page }) => {
  // 1. 访问页面
  await page.goto('https://www.google.com');
  
  // 2. 定位搜索框
  const searchBox = page.locator('textarea[name="q"]');
  
  // 3. 输入内容
  await searchBox.fill('Playwright');
  
  // 4. 提交搜索
  await searchBox.press('Enter');
  
  // 5. 验证结果
  await expect(page).toHaveTitle(/Playwright/);
});
```

### 示例 2：API 测试

```typescript
test('测试 Ollama API', async ({ request }) => {
  const response = await request.post('http://localhost:11434/api/generate', {
    data: {
      model: 'gemma3:4b',
      prompt: 'Hello',
      stream: false
    }
  });
  
  expect(response.ok()).toBeTruthy();
  
  const data = await response.json();
  expect(data.response).toBeDefined();
});
```

### 示例 3：移动端测试

```typescript
test('移动端响应式测试', async ({ page }) => {
  // 设置移动端视口
  await page.setViewportSize({ width: 375, height: 667 });
  
  await page.goto('https://example.com');
  
  // 验证移动端布局
  const menu = page.locator('.mobile-menu');
  await expect(menu).toBeVisible();
});
```

## 🔧 常用技巧

### 1. 等待元素加载

```typescript
// 等待元素可见
await page.locator('#element').waitFor({ state: 'visible' });

// 等待网络空闲
await page.waitForLoadState('networkidle');

// 等待特定时间（不推荐，仅用于调试）
await page.waitForTimeout(1000);
```

### 2. 元素定位最佳实践

```typescript
// ✅ 推荐：使用语义化定位器
page.getByRole('button', { name: '提交' })
page.getByLabel('用户名')
page.getByText('欢迎')

// ⚠️ 次选：使用测试 ID
page.locator('[data-testid="submit-button"]')

// ❌ 避免：使用脆弱的 CSS 选择器
page.locator('.btn.btn-primary.submit')
```

### 3. 截图和调试

```typescript
// 截图
await page.screenshot({ path: 'screenshot.png' });

// 全页截图
await page.screenshot({ path: 'full.png', fullPage: true });

// 元素截图
await page.locator('#element').screenshot({ path: 'element.png' });

// 打印控制台日志
page.on('console', msg => console.log(msg.text()));
```

### 4. 网络请求处理

```typescript
// 监听请求
page.on('request', request => {
  console.log('请求:', request.url());
});

// 拦截和修改请求
await page.route('**/api/**', route => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({ data: 'mocked' })
  });
});
```

## 📈 测试策略建议

### 测试优先级

1. **高优先级** - 核心业务流程
   - 用户登录/注册
   - 关键功能（如支付、提交）
   - 数据完整性验证

2. **中优先级** - 常用功能
   - 搜索和筛选
   - 表单验证
   - 页面导航

3. **低优先级** - 边缘情况
   - 错误处理
   - 边界值测试
   - 性能测试

### 测试覆盖率目标

- ✅ 核心功能：100%
- ✅ 常用功能：80%+
- ✅ 边缘情况：50%+

## 🐛 常见问题

### 1. 浏览器未安装

**错误**：`Executable doesn't exist at ...`

**解决**：
```bash
pnpm test:install
```

### 2. Ollama 服务未运行

**错误**：`connect ECONNREFUSED`

**解决**：
```bash
# 启动 Ollama 服务
ollama serve

# 验证服务运行
curl http://localhost:11434/api/tags
```

### 3. 测试超时

**错误**：`Test timeout of 30000ms exceeded`

**解决**：
```typescript
// 增加超时时间
test('长时间测试', async ({ page }) => {
  test.setTimeout(60000); // 60 秒
  // ... 测试代码
});
```

### 4. 元素定位失败

**错误**：`Timeout waiting for selector`

**解决**：
```typescript
// 使用更宽松的等待
await page.locator('#element').waitFor({ 
  state: 'visible', 
  timeout: 10000 
});

// 或使用调试模式查看页面
pnpm test:debug
```

## 📚 学习资源

- [Playwright 官方文档](https://playwright.dev/)
- [Playwright API 参考](https://playwright.dev/docs/api/class-playwright)
- [测试最佳实践](https://playwright.dev/docs/best-practices)
- [调试指南](https://playwright.dev/docs/debug)

## 🎉 下一步

1. **运行示例测试**
   ```bash
   pnpm test:web
   ```

2. **查看测试报告**
   ```bash
   pnpm test:report
   ```

3. **编写自己的测试**
   - 复制现有测试文件
   - 修改为你的测试场景
   - 运行并验证

4. **集成到 CI/CD**
   - 配置 GitHub Actions
   - 自动化测试执行
   - 生成测试报告

---

**祝测试愉快！** 🚀

如有问题，请查看 `specs/README.md` 获取更详细的文档。

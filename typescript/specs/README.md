# Playwright 自动化测试

本目录包含使用 Playwright 编写的自动化测试脚本。

## 📁 测试文件说明

### 1. `web-automation.spec.ts` - Web 自动化基础测试
包含以下测试场景：
- **搜索引擎测试**：百度、Google、DuckDuckGo 搜索功能
- **表单交互测试**：表单填写、提交、验证
- **页面导航测试**：GitHub 仓库浏览、页面滚动
- **网络请求测试**：API 监听、请求拦截、响应模拟

### 2. `langgraph-api.spec.ts` - LangGraph API 测试
专门测试本地 LangGraph 应用的 API 功能：
- **Ollama API 连接测试**：验证服务可用性
- **生成接口测试**：测试文本生成功能
- **聊天接口测试**：测试对话功能
- **多轮对话测试**：验证上下文记忆
- **工具调用测试**：天气查询、计算等工具
- **性能测试**：并发请求、长文本处理、响应时间
- **错误处理测试**：无效输入、边界情况

### 3. `e2e-scenarios.spec.ts` - E2E 端到端测试
模拟真实用户场景的完整流程：
- **电商购物流程**：商品搜索、浏览、详情查看
- **社交媒体交互**：Twitter/Reddit 浏览和搜索
- **新闻网站浏览**：BBC News、HackerNews 文章阅读
- **视频平台交互**：YouTube 搜索和视频浏览
- **文档网站导航**：Playwright、MDN 文档浏览
- **复杂交互**：拖拽、文件上传、键盘快捷键

## 🚀 快速开始

### 安装依赖
```bash
cd typescript
pnpm install
```

### 运行所有测试
```bash
pnpm test
```

### 运行特定测试文件
```bash
# Web 自动化测试
pnpm test:web

# LangGraph API 测试（需要先启动 Ollama 服务）
pnpm test:api

# E2E 端到端测试
pnpm test:e2e
```

### 运行特定浏览器
```bash
# 仅在 Chromium 中运行
pnpm test:chromium

# 仅在 Firefox 中运行
pnpm test:firefox

# 仅在 WebKit (Safari) 中运行
pnpm test:webkit
```

### 调试模式
```bash
# 以调试模式运行（会打开浏览器并暂停）
pnpm test:debug

# 以有头模式运行（可以看到浏览器操作）
pnpm test:headed

# 使用 UI 模式（图形界面）
pnpm test:ui
```

### 查看测试报告
```bash
pnpm test:report
```

## 📊 测试结果

测试结果会保存在以下位置：
- **HTML 报告**：`test-results/html-report/`
- **JSON 结果**：`test-results/results.json`
- **截图**：`test-results/screenshots/`
- **视频录制**：`test-results/` (失败的测试)
- **追踪文件**：`test-results/` (失败的测试)

## ⚙️ 配置说明

测试配置文件：`playwright.config.ts`

主要配置项：
- **测试目录**：`./specs`
- **超时时间**：30 秒
- **重试次数**：CI 环境 2 次，本地 0 次
- **浏览器**：Chromium、Firefox、WebKit、移动端浏览器
- **截图**：仅失败时截图
- **视频**：仅失败时录制

## 📝 编写测试

### 基本测试结构
```typescript
import { test, expect } from '@playwright/test';

test.describe('测试组名称', () => {
  test('测试用例名称', async ({ page }) => {
    // 1. 导航到页面
    await page.goto('https://example.com');
    
    // 2. 定位元素
    const element = page.locator('selector');
    
    // 3. 执行操作
    await element.click();
    
    // 4. 断言验证
    await expect(element).toBeVisible();
  });
});
```

### 常用 API

#### 页面导航
```typescript
await page.goto('https://example.com');
await page.goBack();
await page.goForward();
await page.reload();
```

#### 元素定位
```typescript
page.locator('css-selector');
page.locator('text=文本内容');
page.getByRole('button', { name: '提交' });
page.getByText('文本内容');
page.getByLabel('标签文本');
```

#### 交互操作
```typescript
await element.click();
await element.fill('文本内容');
await element.type('文本内容');
await element.press('Enter');
await element.check();
await element.selectOption('选项值');
```

#### 断言
```typescript
await expect(element).toBeVisible();
await expect(element).toHaveText('文本');
await expect(element).toHaveValue('值');
await expect(page).toHaveURL('url');
await expect(page).toHaveTitle('标题');
```

## 🔧 常见问题

### 1. 测试运行失败
- 检查网络连接
- 确保目标网站可访问
- 增加超时时间
- 使用 `--headed` 模式查看浏览器操作

### 2. 元素定位失败
- 使用 Playwright Inspector 调试：`pnpm test:debug`
- 检查选择器是否正确
- 增加等待时间：`await element.waitFor()`
- 使用更稳定的定位方式（如 `getByRole`）

### 3. API 测试失败
- 确保 Ollama 服务正在运行
- 检查服务地址和端口
- 验证模型是否已下载
- 增加请求超时时间

### 4. 截图和视频未生成
- 检查 `playwright.config.ts` 配置
- 确保测试失败才会生成（或修改配置为总是生成）
- 检查 `test-results` 目录权限

## 📚 参考资源

- [Playwright 官方文档](https://playwright.dev/)
- [Playwright API 参考](https://playwright.dev/docs/api/class-playwright)
- [测试最佳实践](https://playwright.dev/docs/best-practices)
- [选择器指南](https://playwright.dev/docs/selectors)
- [调试指南](https://playwright.dev/docs/debug)

## 🎯 测试策略

### 测试金字塔
1. **单元测试**（最多）：测试单个函数和组件
2. **集成测试**（中等）：测试模块间交互
3. **E2E 测试**（最少）：测试完整用户流程

### 测试原则
- ✅ 测试用户行为，而非实现细节
- ✅ 使用稳定的定位器（role、label、text）
- ✅ 保持测试独立性，避免依赖
- ✅ 使用有意义的测试名称
- ✅ 适当使用等待和重试
- ❌ 避免硬编码等待时间
- ❌ 避免过度依赖 CSS 选择器
- ❌ 避免测试间共享状态

## 🔄 持续集成

在 CI/CD 中运行测试：

```yaml
# GitHub Actions 示例
- name: Install dependencies
  run: pnpm install

- name: Install Playwright browsers
  run: pnpm exec playwright install --with-deps

- name: Run tests
  run: pnpm test

- name: Upload test results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: test-results/
```

## 📈 测试覆盖率

建议覆盖的测试场景：
- ✅ 核心用户流程（登录、注册、购买等）
- ✅ 关键业务功能
- ✅ 常见错误场景
- ✅ 跨浏览器兼容性
- ✅ 响应式设计（移动端、桌面端）
- ✅ 性能关键路径
- ✅ API 端点和数据流

## 🎨 自定义测试

根据你的项目需求，可以：
1. 修改 `playwright.config.ts` 配置
2. 添加新的测试文件到 `specs/` 目录
3. 创建自定义的 fixtures 和 helpers
4. 配置 CI/CD 自动化测试
5. 集成测试报告工具

---

**Happy Testing! 🎉**

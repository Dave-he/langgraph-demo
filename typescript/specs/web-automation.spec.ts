import { test, expect } from '@playwright/test';

/**
 * 基础 Web 自动化测试示例
 * 测试场景：访问搜索引擎并执行搜索操作
 */

test.describe('搜索引擎自动化测试', () => {
  
  test('百度搜索 - Playwright 关键词', async ({ page }) => {
    // 1. 访问百度首页
    await page.goto('https://www.baidu.com');
    
    // 2. 等待搜索框加载
    const searchInput = page.locator('#kw');
    await expect(searchInput).toBeVisible();
    
    // 3. 输入搜索关键词
    await searchInput.fill('Playwright 自动化测试');
    
    // 4. 点击搜索按钮
    await page.locator('#su').click();
    
    // 5. 等待搜索结果加载
    await page.waitForLoadState('networkidle');
    
    // 6. 验证搜索结果
    const results = page.locator('#content_left .result');
    await expect(results.first()).toBeVisible();
    
    // 7. 验证页面标题包含搜索关键词
    await expect(page).toHaveTitle(/Playwright/);
    
    // 8. 截图保存
    await page.screenshot({ 
      path: 'test-results/screenshots/baidu-search.png',
      fullPage: true 
    });
  });

  test('Google 搜索 - LangGraph 关键词', async ({ page }) => {
    // 1. 访问 Google 首页
    await page.goto('https://www.google.com');
    
    // 2. 处理可能的 Cookie 同意弹窗
    const cookieButton = page.locator('button:has-text("Accept all"), button:has-text("I agree")');
    if (await cookieButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cookieButton.click();
    }
    
    // 3. 定位搜索框（Google 的搜索框可能有多个，使用更精确的选择器）
    const searchBox = page.locator('textarea[name="q"], input[name="q"]').first();
    await expect(searchBox).toBeVisible();
    
    // 4. 输入搜索内容
    await searchBox.fill('LangGraph tutorial');
    
    // 5. 按回车键搜索
    await searchBox.press('Enter');
    
    // 6. 等待搜索结果
    await page.waitForLoadState('domcontentloaded');
    
    // 7. 验证搜索结果容器存在
    const searchResults = page.locator('#search');
    await expect(searchResults).toBeVisible({ timeout: 10000 });
    
    // 8. 截图
    await page.screenshot({ 
      path: 'test-results/screenshots/google-search.png' 
    });
  });

  test('DuckDuckGo 搜索 - TypeScript 关键词', async ({ page }) => {
    // 1. 访问 DuckDuckGo
    await page.goto('https://duckduckgo.com');
    
    // 2. 定位搜索框
    const searchInput = page.locator('input[name="q"]');
    await expect(searchInput).toBeVisible();
    
    // 3. 输入搜索内容并提交
    await searchInput.fill('TypeScript best practices');
    await searchInput.press('Enter');
    
    // 4. 等待结果加载
    await page.waitForLoadState('networkidle');
    
    // 5. 验证结果区域
    const results = page.locator('[data-testid="result"]');
    await expect(results.first()).toBeVisible({ timeout: 10000 });
    
    // 6. 获取第一个结果的标题
    const firstResultTitle = await results.first().locator('h2').textContent();
    console.log('第一个搜索结果:', firstResultTitle);
    
    // 7. 验证结果数量
    const resultCount = await results.count();
    expect(resultCount).toBeGreaterThan(0);
  });
});

test.describe('表单交互测试', () => {
  
  test('表单填写和提交', async ({ page }) => {
    // 访问一个测试表单页面
    await page.goto('https://www.selenium.dev/selenium/web/web-form.html');
    
    // 填写文本输入框
    await page.locator('#my-text-id').fill('测试文本');
    
    // 填写密码框
    await page.locator('input[name="my-password"]').fill('password123');
    
    // 填写文本域
    await page.locator('textarea[name="my-textarea"]').fill('这是一段测试文本内容');
    
    // 选择下拉框
    await page.locator('select[name="my-select"]').selectOption('2');
    
    // 勾选复选框
    await page.locator('#my-check-1').check();
    await page.locator('#my-check-2').check();
    
    // 选择单选按钮
    await page.locator('#my-radio-2').check();
    
    // 截图表单填写后的状态
    await page.screenshot({ 
      path: 'test-results/screenshots/form-filled.png' 
    });
    
    // 点击提交按钮
    await page.locator('button[type="submit"]').click();
    
    // 等待页面跳转或响应
    await page.waitForLoadState('networkidle');
    
    // 验证提交成功（根据实际页面调整）
    await expect(page).toHaveURL(/.*web-form.html/);
  });
});

test.describe('页面导航和交互测试', () => {
  
  test('GitHub 仓库浏览', async ({ page }) => {
    // 1. 访问 GitHub
    await page.goto('https://github.com');
    
    // 2. 点击搜索框
    const searchButton = page.locator('button[aria-label*="Search"], [data-target="qbsearch-input.inputButton"]').first();
    await searchButton.click({ timeout: 5000 });
    
    // 3. 输入搜索内容
    const searchInput = page.locator('#query-builder-test').first();
    await searchInput.fill('playwright');
    await searchInput.press('Enter');
    
    // 4. 等待搜索结果
    await page.waitForLoadState('domcontentloaded');
    
    // 5. 点击 Repositories 标签（如果存在）
    const repoTab = page.locator('a:has-text("Repositories")').first();
    if (await repoTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await repoTab.click();
      await page.waitForLoadState('networkidle');
    }
    
    // 6. 验证搜索结果
    await expect(page.locator('h1, h2, h3').filter({ hasText: /repositories|results/i }).first())
      .toBeVisible({ timeout: 10000 });
    
    // 7. 截图
    await page.screenshot({ 
      path: 'test-results/screenshots/github-search.png',
      fullPage: true 
    });
  });

  test('页面滚动和元素可见性', async ({ page }) => {
    // 访问一个长页面
    await page.goto('https://playwright.dev/');
    
    // 滚动到页面底部
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    
    // 滚动到页面顶部
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);
    
    // 滚动到特定元素
    const footer = page.locator('footer').first();
    await footer.scrollIntoViewIfNeeded();
    
    // 验证元素在视口中
    await expect(footer).toBeInViewport();
    
    // 截图
    await page.screenshot({ 
      path: 'test-results/screenshots/scroll-test.png' 
    });
  });
});

test.describe('API 和网络请求测试', () => {
  
  test('监听网络请求', async ({ page }) => {
    // 监听所有网络请求
    const requests: string[] = [];
    page.on('request', request => {
      requests.push(request.url());
    });
    
    // 监听特定的 API 请求
    const apiResponses: any[] = [];
    page.on('response', async response => {
      if (response.url().includes('/api/') || response.url().includes('.json')) {
        try {
          const json = await response.json();
          apiResponses.push({ url: response.url(), data: json });
        } catch (e) {
          // 不是 JSON 响应
        }
      }
    });
    
    // 访问页面
    await page.goto('https://jsonplaceholder.typicode.com/');
    
    // 点击一个会触发 API 请求的链接
    const postsLink = page.locator('a[href="/posts"]').first();
    if (await postsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await postsLink.click();
      await page.waitForLoadState('networkidle');
    }
    
    // 验证请求数量
    console.log(`捕获到 ${requests.length} 个网络请求`);
    console.log(`捕获到 ${apiResponses.length} 个 API 响应`);
    
    expect(requests.length).toBeGreaterThan(0);
  });

  test('模拟 API 响应', async ({ page }) => {
    // 拦截并模拟 API 响应
    await page.route('**/api/users', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          users: [
            { id: 1, name: 'Test User 1' },
            { id: 2, name: 'Test User 2' }
          ]
        })
      });
    });
    
    // 访问会调用该 API 的页面
    await page.goto('https://example.com');
    
    // 后续测试逻辑...
  });
});

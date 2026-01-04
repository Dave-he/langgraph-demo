import { test, expect } from '@playwright/test';

/**
 * 移动端自动化测试示例
 * 测试移动端特定的交互和响应式设计
 */

test.describe('移动端响应式测试', () => {
  
  test.use({ 
    viewport: { width: 375, height: 667 }, // iPhone SE 尺寸
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
  });

  test('移动端导航菜单', async ({ page }) => {
    await page.goto('https://playwright.dev/');
    
    // 查找汉堡菜单按钮（移动端）
    const menuButton = page.locator('button[aria-label*="menu"], .navbar__toggle').first();
    
    if (await menuButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // 点击打开菜单
      await menuButton.click();
      await page.waitForTimeout(500);
      
      // 验证菜单展开
      const nav = page.locator('nav, .navbar__items').first();
      await expect(nav).toBeVisible();
      
      // 截图
      await page.screenshot({ 
        path: 'test-results/screenshots/mobile-menu.png' 
      });
    }
  });

  test('移动端表单输入', async ({ page }) => {
    await page.goto('https://www.google.com');
    
    // 移动端搜索框
    const searchBox = page.locator('textarea[name="q"], input[name="q"]').first();
    await searchBox.tap(); // 使用 tap 而不是 click
    
    await searchBox.fill('mobile testing');
    
    // 模拟移动端键盘
    await page.keyboard.press('Enter');
    
    await page.waitForLoadState('networkidle');
    
    // 截图
    await page.screenshot({ 
      path: 'test-results/screenshots/mobile-search.png' 
    });
  });

  test('移动端滑动操作', async ({ page }) => {
    await page.goto('https://playwright.dev/');
    
    // 向下滑动
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(500);
    
    // 向上滑动
    await page.evaluate(() => window.scrollBy(0, -300));
    await page.waitForTimeout(500);
    
    // 滑动到底部
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // 截图
    await page.screenshot({ 
      path: 'test-results/screenshots/mobile-scroll.png' 
    });
  });
});

test.describe('触摸手势测试', () => {
  
  test.use({ 
    hasTouch: true,
    viewport: { width: 375, height: 667 }
  });

  test('点击和长按', async ({ page }) => {
    await page.goto('https://www.selenium.dev/selenium/web/clicks.html');
    
    // 查找可点击元素
    const clickable = page.locator('#click').first();
    
    if (await clickable.isVisible({ timeout: 5000 }).catch(() => false)) {
      // 普通点击
      await clickable.tap();
      await page.waitForTimeout(500);
      
      // 长按（通过鼠标事件模拟）
      await clickable.click({ delay: 1000 });
      
      // 截图
      await page.screenshot({ 
        path: 'test-results/screenshots/touch-gestures.png' 
      });
    }
  });

  test('双击操作', async ({ page }) => {
    await page.goto('https://www.selenium.dev/selenium/web/clicks.html');
    
    const element = page.locator('#click').first();
    
    if (await element.isVisible({ timeout: 5000 }).catch(() => false)) {
      // 双击
      await element.dblclick();
      
      await page.waitForTimeout(500);
      
      // 截图
      await page.screenshot({ 
        path: 'test-results/screenshots/double-tap.png' 
      });
    }
  });
});

test.describe('不同设备尺寸测试', () => {
  
  const devices = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 12 Pro', width: 390, height: 844 },
    { name: 'iPad', width: 768, height: 1024 },
    { name: 'iPad Pro', width: 1024, height: 1366 },
    { name: 'Android Phone', width: 360, height: 640 },
  ];

  for (const device of devices) {
    test(`${device.name} 响应式布局`, async ({ page }) => {
      // 设置视口大小
      await page.setViewportSize({ 
        width: device.width, 
        height: device.height 
      });
      
      // 访问页面
      await page.goto('https://playwright.dev/');
      
      // 等待页面加载
      await page.waitForLoadState('networkidle');
      
      // 截图
      await page.screenshot({ 
        path: `test-results/screenshots/responsive-${device.name.replace(/\s+/g, '-')}.png`,
        fullPage: true
      });
      
      // 验证页面标题可见
      const title = page.locator('h1, .hero__title').first();
      await expect(title).toBeVisible({ timeout: 10000 });
    });
  }
});

test.describe('横屏和竖屏测试', () => {
  
  test('竖屏模式', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('https://www.google.com');
    
    await page.screenshot({ 
      path: 'test-results/screenshots/portrait-mode.png' 
    });
  });

  test('横屏模式', async ({ page }) => {
    await page.setViewportSize({ width: 667, height: 375 });
    
    await page.goto('https://www.google.com');
    
    await page.screenshot({ 
      path: 'test-results/screenshots/landscape-mode.png' 
    });
  });
});

test.describe('移动端性能测试', () => {
  
  test('页面加载性能', async ({ page }) => {
    // 模拟慢速 3G 网络
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 100); // 添加 100ms 延迟
    });
    
    const startTime = Date.now();
    
    await page.goto('https://playwright.dev/', {
      waitUntil: 'networkidle'
    });
    
    const loadTime = Date.now() - startTime;
    console.log(`页面加载时间: ${loadTime}ms`);
    
    // 验证加载时间在合理范围内
    expect(loadTime).toBeLessThan(10000); // 10 秒内
  });

  test('资源加载优化', async ({ page }) => {
    const resourceSizes: { [key: string]: number } = {};
    
    page.on('response', async response => {
      const url = response.url();
      const headers = response.headers();
      const contentLength = headers['content-length'];
      
      if (contentLength) {
        const size = parseInt(contentLength);
        const type = headers['content-type'] || 'unknown';
        
        if (!resourceSizes[type]) {
          resourceSizes[type] = 0;
        }
        resourceSizes[type] += size;
      }
    });
    
    await page.goto('https://playwright.dev/');
    await page.waitForLoadState('networkidle');
    
    console.log('资源大小统计:', resourceSizes);
    
    // 验证总资源大小
    const totalSize = Object.values(resourceSizes).reduce((a, b) => a + b, 0);
    console.log(`总资源大小: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  });
});

test.describe('移动端特定功能测试', () => {
  
  test('地理位置模拟', async ({ page, context }) => {
    // 模拟地理位置（北京）
    await context.setGeolocation({ 
      latitude: 39.9042, 
      longitude: 116.4074 
    });
    
    // 授予地理位置权限
    await context.grantPermissions(['geolocation']);
    
    // 访问需要地理位置的页面
    await page.goto('https://www.openstreetmap.org/');
    
    // 点击定位按钮（如果有）
    const locationButton = page.locator('button[title*="location"], a[title*="location"]').first();
    
    if (await locationButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await locationButton.click();
      await page.waitForTimeout(2000);
      
      // 截图
      await page.screenshot({ 
        path: 'test-results/screenshots/geolocation.png' 
      });
    }
  });

  test('设备方向模拟', async ({ page }) => {
    // 设置设备方向
    await page.emulateMedia({ colorScheme: 'dark' });
    
    await page.goto('https://playwright.dev/');
    
    // 截图暗色模式
    await page.screenshot({ 
      path: 'test-results/screenshots/dark-mode.png' 
    });
    
    // 切换到亮色模式
    await page.emulateMedia({ colorScheme: 'light' });
    
    // 截图亮色模式
    await page.screenshot({ 
      path: 'test-results/screenshots/light-mode.png' 
    });
  });

  test('离线模式测试', async ({ page, context }) => {
    // 设置离线模式
    await context.setOffline(true);
    
    // 尝试访问页面
    const response = await page.goto('https://playwright.dev/', {
      waitUntil: 'domcontentloaded',
      timeout: 5000
    }).catch(() => null);
    
    // 验证离线状态
    if (!response) {
      console.log('离线模式：页面无法加载');
    }
    
    // 恢复在线模式
    await context.setOffline(false);
    
    // 重新加载页面
    await page.goto('https://playwright.dev/');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('移动端表单和输入测试', () => {
  
  test('虚拟键盘交互', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('https://www.selenium.dev/selenium/web/web-form.html');
    
    // 聚焦输入框（会触发虚拟键盘）
    const textInput = page.locator('#my-text-id');
    await textInput.tap();
    
    // 输入文本
    await textInput.fill('移动端测试');
    
    // 聚焦下一个输入框
    const passwordInput = page.locator('input[name="my-password"]');
    await passwordInput.tap();
    await passwordInput.fill('password123');
    
    // 截图
    await page.screenshot({ 
      path: 'test-results/screenshots/virtual-keyboard.png' 
    });
  });

  test('选择器和日期选择', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('https://www.selenium.dev/selenium/web/web-form.html');
    
    // 选择下拉框
    const select = page.locator('select[name="my-select"]');
    await select.tap();
    await select.selectOption('2');
    
    // 日期选择（如果有）
    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dateInput.tap();
      await dateInput.fill('2024-01-15');
    }
    
    // 截图
    await page.screenshot({ 
      path: 'test-results/screenshots/mobile-form-inputs.png' 
    });
  });
});

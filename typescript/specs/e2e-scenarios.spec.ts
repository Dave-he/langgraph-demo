import { test, expect } from '@playwright/test';

/**
 * E2E 端到端测试示例
 * 模拟真实用户场景的完整流程测试
 */

test.describe('电商网站购物流程 E2E 测试', () => {
  
  test('完整购物流程 - 从浏览到下单', async ({ page }) => {
    // 1. 访问电商首页
    await page.goto('https://www.amazon.com');
    
    // 2. 搜索商品
    const searchBox = page.locator('#twotabsearchtextbox');
    await searchBox.fill('laptop');
    await searchBox.press('Enter');
    
    // 3. 等待搜索结果加载
    await page.waitForLoadState('networkidle');
    
    // 4. 点击第一个商品
    const firstProduct = page.locator('[data-component-type="s-search-result"]').first();
    await firstProduct.locator('h2 a').click();
    
    // 5. 等待商品详情页加载
    await page.waitForLoadState('domcontentloaded');
    
    // 6. 验证商品标题存在
    const productTitle = page.locator('#productTitle');
    await expect(productTitle).toBeVisible({ timeout: 10000 });
    
    // 7. 获取商品信息
    const title = await productTitle.textContent();
    console.log('商品标题:', title?.trim());
    
    // 8. 截图商品详情页
    await page.screenshot({ 
      path: 'test-results/screenshots/product-detail.png',
      fullPage: true 
    });
    
    // 注意：实际的加入购物车和结账流程需要登录，这里仅做演示
  });
});

test.describe('社交媒体交互 E2E 测试', () => {
  
  test('Twitter/X 浏览和搜索', async ({ page }) => {
    // 1. 访问 Twitter
    await page.goto('https://twitter.com');
    
    // 2. 等待页面加载
    await page.waitForLoadState('domcontentloaded');
    
    // 3. 查找搜索框（Twitter 的搜索框可能需要先点击）
    const searchButton = page.locator('[aria-label*="Search"], [data-testid="SearchBox_Search_Input"]').first();
    
    if (await searchButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchButton.click();
      
      // 4. 输入搜索内容
      await searchButton.fill('Playwright automation');
      await searchButton.press('Enter');
      
      // 5. 等待搜索结果
      await page.waitForLoadState('networkidle');
      
      // 6. 截图
      await page.screenshot({ 
        path: 'test-results/screenshots/twitter-search.png' 
      });
    }
  });

  test('Reddit 浏览热门帖子', async ({ page }) => {
    // 1. 访问 Reddit
    await page.goto('https://www.reddit.com');
    
    // 2. 等待页面加载
    await page.waitForLoadState('domcontentloaded');
    
    // 3. 查找热门帖子
    const posts = page.locator('[data-testid="post-container"], article').first();
    await expect(posts).toBeVisible({ timeout: 10000 });
    
    // 4. 点击第一个帖子
    const firstPostTitle = posts.locator('h3, [data-click-id="body"]').first();
    if (await firstPostTitle.isVisible({ timeout: 5000 }).catch(() => false)) {
      const postText = await firstPostTitle.textContent();
      console.log('帖子标题:', postText?.trim());
      
      await firstPostTitle.click();
      
      // 5. 等待帖子详情加载
      await page.waitForLoadState('networkidle');
      
      // 6. 截图
      await page.screenshot({ 
        path: 'test-results/screenshots/reddit-post.png',
        fullPage: true 
      });
    }
  });
});

test.describe('新闻网站内容浏览 E2E 测试', () => {
  
  test('BBC News 文章阅读流程', async ({ page }) => {
    // 1. 访问 BBC News
    await page.goto('https://www.bbc.com/news');
    
    // 2. 等待页面加载
    await page.waitForLoadState('domcontentloaded');
    
    // 3. 查找新闻标题
    const headlines = page.locator('h2, h3').filter({ hasText: /.+/ });
    const headlineCount = await headlines.count();
    console.log(`找到 ${headlineCount} 个新闻标题`);
    
    // 4. 点击第一个新闻
    if (headlineCount > 0) {
      const firstHeadline = headlines.first();
      const headlineText = await firstHeadline.textContent();
      console.log('新闻标题:', headlineText?.trim());
      
      // 查找可点击的链接
      const link = firstHeadline.locator('..').locator('a').first();
      if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
        await link.click();
        
        // 5. 等待文章加载
        await page.waitForLoadState('networkidle');
        
        // 6. 验证文章内容
        const article = page.locator('article, [role="main"]').first();
        await expect(article).toBeVisible({ timeout: 10000 });
        
        // 7. 截图
        await page.screenshot({ 
          path: 'test-results/screenshots/bbc-article.png',
          fullPage: true 
        });
      }
    }
  });

  test('HackerNews 热门文章浏览', async ({ page }) => {
    // 1. 访问 HackerNews
    await page.goto('https://news.ycombinator.com');
    
    // 2. 等待页面加载
    await page.waitForLoadState('domcontentloaded');
    
    // 3. 获取所有文章标题
    const stories = page.locator('.athing');
    const storyCount = await stories.count();
    console.log(`找到 ${storyCount} 个故事`);
    
    // 4. 遍历前 5 个故事
    const storyTitles: string[] = [];
    for (let i = 0; i < Math.min(5, storyCount); i++) {
      const story = stories.nth(i);
      const titleLink = story.locator('.titleline a').first();
      const title = await titleLink.textContent();
      storyTitles.push(title || '');
    }
    
    console.log('热门故事:', storyTitles);
    
    // 5. 点击第一个故事
    if (storyCount > 0) {
      const firstStory = stories.first();
      const firstLink = firstStory.locator('.titleline a').first();
      
      // 获取链接地址
      const href = await firstLink.getAttribute('href');
      console.log('第一个故事链接:', href);
      
      // 6. 截图
      await page.screenshot({ 
        path: 'test-results/screenshots/hackernews.png' 
      });
    }
  });
});

test.describe('视频平台交互 E2E 测试', () => {
  
  test('YouTube 搜索和视频浏览', async ({ page }) => {
    // 1. 访问 YouTube
    await page.goto('https://www.youtube.com');
    
    // 2. 处理可能的 Cookie 弹窗
    const acceptButton = page.locator('button:has-text("Accept all"), button:has-text("同意")').first();
    if (await acceptButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await acceptButton.click();
    }
    
    // 3. 查找搜索框
    const searchBox = page.locator('input#search').first();
    await expect(searchBox).toBeVisible({ timeout: 10000 });
    
    // 4. 输入搜索内容
    await searchBox.fill('Playwright tutorial');
    await searchBox.press('Enter');
    
    // 5. 等待搜索结果
    await page.waitForLoadState('networkidle');
    
    // 6. 查找视频结果
    const videos = page.locator('ytd-video-renderer, ytd-grid-video-renderer');
    const videoCount = await videos.count();
    console.log(`找到 ${videoCount} 个视频`);
    
    // 7. 获取第一个视频信息
    if (videoCount > 0) {
      const firstVideo = videos.first();
      const videoTitle = await firstVideo.locator('#video-title').textContent();
      console.log('视频标题:', videoTitle?.trim());
      
      // 8. 截图
      await page.screenshot({ 
        path: 'test-results/screenshots/youtube-search.png',
        fullPage: true 
      });
    }
  });
});

test.describe('文档网站导航 E2E 测试', () => {
  
  test('Playwright 官方文档浏览', async ({ page }) => {
    // 1. 访问 Playwright 文档
    await page.goto('https://playwright.dev/');
    
    // 2. 点击 "Get Started" 或 "Docs"
    const getStartedLink = page.locator('a:has-text("Get started"), a:has-text("Docs")').first();
    await getStartedLink.click();
    
    // 3. 等待文档页面加载
    await page.waitForLoadState('networkidle');
    
    // 4. 验证侧边栏导航存在
    const sidebar = page.locator('nav, aside, [class*="sidebar"]').first();
    await expect(sidebar).toBeVisible({ timeout: 10000 });
    
    // 5. 点击侧边栏的一个链接
    const sidebarLinks = sidebar.locator('a').filter({ hasText: /.+/ });
    const linkCount = await sidebarLinks.count();
    
    if (linkCount > 0) {
      const secondLink = sidebarLinks.nth(1);
      const linkText = await secondLink.textContent();
      console.log('点击链接:', linkText?.trim());
      
      await secondLink.click();
      await page.waitForLoadState('networkidle');
      
      // 6. 验证内容区域
      const content = page.locator('main, article, [role="main"]').first();
      await expect(content).toBeVisible();
      
      // 7. 截图
      await page.screenshot({ 
        path: 'test-results/screenshots/playwright-docs.png',
        fullPage: true 
      });
    }
  });

  test('MDN Web Docs 搜索和浏览', async ({ page }) => {
    // 1. 访问 MDN
    await page.goto('https://developer.mozilla.org/');
    
    // 2. 查找搜索框
    const searchButton = page.locator('button[aria-label*="Search"], input[type="search"]').first();
    
    if (await searchButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchButton.click();
      
      // 3. 输入搜索内容
      const searchInput = page.locator('input[type="search"]').first();
      await searchInput.fill('JavaScript async await');
      await searchInput.press('Enter');
      
      // 4. 等待搜索结果
      await page.waitForLoadState('networkidle');
      
      // 5. 点击第一个结果
      const firstResult = page.locator('a[href*="/docs/"]').first();
      if (await firstResult.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstResult.click();
        
        // 6. 等待文档加载
        await page.waitForLoadState('networkidle');
        
        // 7. 截图
        await page.screenshot({ 
          path: 'test-results/screenshots/mdn-docs.png',
          fullPage: true 
        });
      }
    }
  });
});

test.describe('复杂交互场景测试', () => {
  
  test('拖拽操作测试', async ({ page }) => {
    // 访问一个支持拖拽的测试页面
    await page.goto('https://www.selenium.dev/selenium/web/dragAndDropTest.html');
    
    // 查找可拖拽元素
    const draggable = page.locator('#draggable');
    const droppable = page.locator('#droppable');
    
    // 验证元素存在
    await expect(draggable).toBeVisible();
    await expect(droppable).toBeVisible();
    
    // 执行拖拽操作
    await draggable.dragTo(droppable);
    
    // 验证拖拽成功（根据实际页面调整验证逻辑）
    await page.waitForTimeout(1000);
    
    // 截图
    await page.screenshot({ 
      path: 'test-results/screenshots/drag-drop.png' 
    });
  });

  test('文件上传测试', async ({ page }) => {
    // 访问文件上传测试页面
    await page.goto('https://www.selenium.dev/selenium/web/upload.html');
    
    // 查找文件上传输入框
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
    
    // 创建一个临时测试文件
    const fs = require('fs');
    const path = require('path');
    const testFilePath = path.join(__dirname, '../../test-results/test-upload.txt');
    fs.writeFileSync(testFilePath, 'This is a test file for upload');
    
    // 上传文件
    await fileInput.setInputFiles(testFilePath);
    
    // 提交表单（如果有提交按钮）
    const submitButton = page.locator('input[type="submit"], button[type="submit"]');
    if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submitButton.click();
      await page.waitForLoadState('networkidle');
    }
    
    // 截图
    await page.screenshot({ 
      path: 'test-results/screenshots/file-upload.png' 
    });
  });

  test('键盘快捷键测试', async ({ page }) => {
    await page.goto('https://www.google.com');
    
    // 使用键盘快捷键
    await page.keyboard.press('Control+A'); // 全选
    await page.keyboard.press('Control+C'); // 复制
    
    // 在搜索框中使用快捷键
    const searchBox = page.locator('textarea[name="q"], input[name="q"]').first();
    await searchBox.click();
    
    await page.keyboard.type('Playwright');
    await page.keyboard.press('Control+A'); // 全选
    await page.keyboard.press('Backspace'); // 删除
    
    await page.keyboard.type('New search term');
    
    // 截图
    await page.screenshot({ 
      path: 'test-results/screenshots/keyboard-test.png' 
    });
  });
});

import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 测试配置文件
 * 文档: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // 测试文件目录
  testDir: './specs',
  
  // 测试超时时间（30秒）
  timeout: 30 * 1000,
  
  // 每个测试的期望超时时间
  expect: {
    timeout: 5000
  },
  
  // 失败时重试次数
  fullyParallel: true,
  
  // 禁止在 CI 环境中提交测试文件
  forbidOnly: !!process.env.CI,
  
  // CI 环境中失败重试次数
  retries: process.env.CI ? 2 : 0,
  
  // 并行执行的 worker 数量
  workers: process.env.CI ? 1 : undefined,
  
  // 测试报告配置
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],
  
  // 全局配置
  use: {
    // 操作追踪（失败时保留）
    trace: 'on-first-retry',
    
    // 截图配置
    screenshot: 'only-on-failure',
    
    // 视频录制
    video: 'retain-on-failure',
    
    // 浏览器上下文选项
    viewport: { width: 1280, height: 720 },
    
    // 操作超时
    actionTimeout: 10 * 1000,
    
    // 导航超时
    navigationTimeout: 30 * 1000,
  },

  // 配置不同的浏览器项目
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // 移动端浏览器测试
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
});

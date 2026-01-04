import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 测试配置文件 - 基础版
 * 只运行不依赖外部服务的测试
 */
export default defineConfig({
  testDir: './specs',
  timeout: 30 * 1000,
  
  expect: {
    timeout: 5000
  },
  
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],
  
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10 * 1000,
    navigationTimeout: 30 * 1000,
  },

  // 只配置 Chromium 浏览器以加快测试速度
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

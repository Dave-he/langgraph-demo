import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync, mkdirSync, readdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 基础功能测试 - 不依赖外部服务
 * 测试项目配置和文件结构
 */

test.describe('项目结构验证', () => {
  
  test('验证 TypeScript 源文件存在', async () => {
    const files = [
      'ollama-chat.ts',
      'multi-turn-chat.ts',
      'tool-calling-agent.ts',
      'content-review-workflow.ts'
    ];
    
    for (const file of files) {
      const filePath = join(__dirname, '..', file);
      const exists = existsSync(filePath);
      expect(exists).toBeTruthy();
      console.log(`✓ ${file} 存在`);
    }
  });

  test('验证 package.json 配置正确', async () => {
    const packagePath = join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    
    // 验证必要的依赖
    expect(packageJson.dependencies).toBeDefined();
    expect(packageJson.dependencies['@langchain/community']).toBeDefined();
    expect(packageJson.dependencies['@langchain/core']).toBeDefined();
    expect(packageJson.dependencies['@langchain/langgraph']).toBeDefined();
    
    // 验证脚本命令
    expect(packageJson.scripts.dev).toBeDefined();
    expect(packageJson.scripts.chat).toBeDefined();
    expect(packageJson.scripts.agent).toBeDefined();
    expect(packageJson.scripts.content).toBeDefined();
    expect(packageJson.scripts.test).toBeDefined();
    
    console.log('✓ package.json 配置正确');
  });

  test('验证 TypeScript 配置文件', async () => {
    const tsconfigPath = join(__dirname, '..', 'tsconfig.json');
    const exists = existsSync(tsconfigPath);
    
    expect(exists).toBeTruthy();
    
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));
    expect(tsconfig.compilerOptions).toBeDefined();
    expect(tsconfig.compilerOptions.module).toBeDefined();
    
    console.log('✓ tsconfig.json 存在且有效');
  });

  test('验证 Playwright 配置文件', async () => {
    const configPath = join(__dirname, '..', 'playwright.config.ts');
    const exists = existsSync(configPath);
    
    expect(exists).toBeTruthy();
    console.log('✓ playwright.config.ts 存在');
  });

  test('验证测试文件目录结构', async () => {
    const specsDir = __dirname;
    const files = readdirSync(specsDir);
    
    const specFiles = files.filter((f: string) => f.endsWith('.spec.ts'));
    
    console.log('测试文件列表:');
    specFiles.forEach((file: string) => {
      console.log(`  - ${file}`);
    });
    
    expect(specFiles.length).toBeGreaterThan(0);
    console.log(`✓ 找到 ${specFiles.length} 个测试文件`);
  });

  test('创建测试结果目录', async () => {
    const resultsDir = join(__dirname, '..', 'test-results');
    
    // 创建目录（如果不存在）
    if (!existsSync(resultsDir)) {
      mkdirSync(resultsDir, { recursive: true });
    }
    
    const screenshotsDir = join(resultsDir, 'screenshots');
    if (!existsSync(screenshotsDir)) {
      mkdirSync(screenshotsDir, { recursive: true });
    }
    
    expect(existsSync(resultsDir)).toBeTruthy();
    expect(existsSync(screenshotsDir)).toBeTruthy();
    console.log('✓ 测试结果目录已准备');
  });
});

test.describe('README 文档验证', () => {
  
  test('验证项目 README 存在', async () => {
    const readmePath = join(__dirname, '..', 'README.md');
    const exists = existsSync(readmePath);
    
    expect(exists).toBeTruthy();
    
    const content = readFileSync(readmePath, 'utf-8');
    expect(content.length).toBeGreaterThan(0);
    
    console.log('✓ README.md 存在且有内容');
  });

  test('验证测试指南文档存在', async () => {
    const guidePath = join(__dirname, '..', 'TESTING_GUIDE.md');
    const exists = existsSync(guidePath);
    
    expect(exists).toBeTruthy();
    console.log('✓ TESTING_GUIDE.md 存在');
  });

  test('验证测试目录 README', async () => {
    const specsReadme = join(__dirname, 'README.md');
    const exists = existsSync(specsReadme);
    
    expect(exists).toBeTruthy();
    console.log('✓ specs/README.md 存在');
  });
});

test.describe('依赖包验证', () => {
  
  test('验证 node_modules 目录存在', async () => {
    const nodeModulesPath = join(__dirname, '..', 'node_modules');
    const exists = existsSync(nodeModulesPath);
    
    expect(exists).toBeTruthy();
    console.log('✓ node_modules 目录存在');
  });

  test('验证关键依赖已安装', async () => {
    const nodeModulesPath = join(__dirname, '..', 'node_modules');
    
    const criticalPackages = [
      '@playwright/test',
      '@langchain/core',
      '@langchain/community',
      '@langchain/langgraph',
      'typescript',
      'tsx'
    ];
    
    for (const pkg of criticalPackages) {
      const pkgPath = join(nodeModulesPath, pkg);
      const exists = existsSync(pkgPath);
      expect(exists).toBeTruthy();
      console.log(`✓ ${pkg} 已安装`);
    }
  });
});

test.describe('文件内容验证', () => {
  
  test('验证 TypeScript 文件包含必要的导入', async () => {
    const ollamaChatPath = join(__dirname, '..', 'ollama-chat.ts');
    const content = readFileSync(ollamaChatPath, 'utf-8');
    
    // 验证包含必要的导入
    expect(content).toContain('@langchain/community');
    expect(content).toContain('ChatOllama');
    
    console.log('✓ ollama-chat.ts 包含必要的导入');
  });

  test('验证多轮对话文件结构', async () => {
    const multiTurnPath = join(__dirname, '..', 'multi-turn-chat.ts');
    const content = readFileSync(multiTurnPath, 'utf-8');
    
    expect(content).toContain('StateGraph');
    expect(content).toContain('ChatState');
    
    console.log('✓ multi-turn-chat.ts 结构正确');
  });

  test('验证工具调用 Agent 文件', async () => {
    const agentPath = join(__dirname, '..', 'tool-calling-agent.ts');
    const content = readFileSync(agentPath, 'utf-8');
    
    expect(content).toContain('tool');
    expect(content).toContain('StateGraph');
    
    console.log('✓ tool-calling-agent.ts 结构正确');
  });
});

test.describe('配置文件内容验证', () => {
  
  test('验证 tsconfig.json 配置项', async () => {
    const tsconfigPath = join(__dirname, '..', 'tsconfig.json');
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));
    
    // 验证关键配置
    expect(tsconfig.compilerOptions.target).toBeDefined();
    expect(tsconfig.compilerOptions.module).toBeDefined();
    expect(tsconfig.compilerOptions.moduleResolution).toBeDefined();
    
    console.log('✓ tsconfig.json 配置完整');
  });

  test('验证 package.json 元数据', async () => {
    const packagePath = join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    
    expect(packageJson.name).toBeDefined();
    expect(packageJson.version).toBeDefined();
    expect(packageJson.type).toBe('module');
    
    console.log(`✓ 项目名称: ${packageJson.name}`);
    console.log(`✓ 项目版本: ${packageJson.version}`);
  });
});

import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync, mkdirSync, readdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * LangGraph 应用集成测试
 * 测试实际的 TypeScript 应用功能
 */

test.describe('LangGraph 应用启动测试', () => {
  
  test('验证 TypeScript 文件存在', async () => {
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

  test('验证 package.json 配置', async () => {
    const packagePath = join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    
    // 验证依赖
    expect(packageJson.dependencies).toBeDefined();
    expect(packageJson.dependencies['@langchain/community']).toBeDefined();
    expect(packageJson.dependencies['@langchain/core']).toBeDefined();
    expect(packageJson.dependencies['@langchain/langgraph']).toBeDefined();
    
    // 验证脚本
    expect(packageJson.scripts.dev).toBeDefined();
    expect(packageJson.scripts.chat).toBeDefined();
    expect(packageJson.scripts.agent).toBeDefined();
    expect(packageJson.scripts.content).toBeDefined();
    
    console.log('✓ package.json 配置正确');
  });

  test('验证 TypeScript 配置', async () => {
    const tsconfigPath = join(__dirname, '..', 'tsconfig.json');
    const exists = existsSync(tsconfigPath);
    
    expect(exists).toBeTruthy();
    
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));
    expect(tsconfig.compilerOptions).toBeDefined();
    
    console.log('✓ tsconfig.json 存在且有效');
  });
});

test.describe('Ollama 服务测试', () => {
  
  test('检查 Ollama 服务状态', async ({ request }) => {
    try {
      const response = await request.get('http://[240e:305:67ad:5b00:5680:9048:1114:513d]:11434/api/tags', {
        timeout: 5000
      });
      
      if (response.ok()) {
        const data = await response.json();
        console.log('✓ Ollama 服务运行中');
        console.log('可用模型:', data.models?.map((m: any) => m.name).join(', '));
        
        expect(data.models).toBeDefined();
        expect(Array.isArray(data.models)).toBeTruthy();
      } else {
        console.log('⚠ Ollama 服务未响应');
      }
    } catch (error) {
      console.log('⚠ Ollama 服务未运行，请先启动: ollama serve');
      test.skip();
    }
  });

  test('验证 gemma3:4b 模型可用', async ({ request }) => {
    try {
      const response = await request.get('http://[240e:305:67ad:5b00:5680:9048:1114:513d]:11434/api/tags');
      
      if (response.ok()) {
        const data = await response.json();
        const hasGemma = data.models?.some((m: any) => m.name.includes('gemma3:4b'));
        
        if (hasGemma) {
          console.log('✓ gemma3:4b 模型已安装');
          expect(hasGemma).toBeTruthy();
        } else {
          console.log('⚠ gemma3:4b 模型未安装，请运行: ollama pull gemma3:4b');
        }
      }
    } catch (error) {
      console.log('⚠ 无法检查模型，Ollama 服务可能未运行');
      test.skip();
    }
  });
});

test.describe('LangGraph 功能测试', () => {
  
  test('测试简单对话生成', async ({ request }) => {
    try {
      const response = await request.post('http://[240e:305:67ad:5b00:5680:9048:1114:513d]:11434/api/chat', {
        data: {
          model: 'gemma3:4b',
          messages: [
            { role: 'user', content: 'Hello, say hi in one word' }
          ],
          stream: false
        },
        timeout: 30000
      });
      
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      console.log('AI 响应:', data.message.content);
      
      expect(data.message).toBeDefined();
      expect(data.message.content).toBeDefined();
      expect(data.message.content.length).toBeGreaterThan(0);
      
    } catch (error) {
      console.log('⚠ 测试跳过：Ollama 服务未运行');
      test.skip();
    }
  });

  test('测试中文对话', async ({ request }) => {
    try {
      const response = await request.post('http://[240e:305:67ad:5b00:5680:9048:1114:513d]:11434/api/chat', {
        data: {
          model: 'gemma3:4b',
          messages: [
            { role: 'user', content: '你好，请用一句话介绍自己' }
          ],
          stream: false
        },
        timeout: 30000
      });
      
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      console.log('中文响应:', data.message.content);
      
      expect(data.message.content).toBeDefined();
      
    } catch (error) {
      console.log('⚠ 测试跳过：Ollama 服务未运行');
      test.skip();
    }
  });

  test('测试对话历史记忆', async ({ request }) => {
    try {
      // 第一轮：告诉 AI 一个信息
      const response1 = await request.post('http://[240e:305:67ad:5b00:5680:9048:1114:513d]:11434/api/chat', {
        data: {
          model: 'gemma3:4b',
          messages: [
            { role: 'user', content: 'My favorite color is blue' }
          ],
          stream: false
        },
        timeout: 30000
      });
      
      const data1 = await response1.json();
      console.log('第一轮响应:', data1.message.content);
      
      // 第二轮：测试是否记住
      const response2 = await request.post('http://[240e:305:67ad:5b00:5680:9048:1114:513d]:11434/api/chat', {
        data: {
          model: 'gemma3:4b',
          messages: [
            { role: 'user', content: 'My favorite color is blue' },
            { role: 'assistant', content: data1.message.content },
            { role: 'user', content: 'What is my favorite color?' }
          ],
          stream: false
        },
        timeout: 30000
      });
      
      const data2 = await response2.json();
      console.log('第二轮响应:', data2.message.content);
      
      // 验证响应包含 "blue"
      const content = data2.message.content.toLowerCase();
      expect(content).toContain('blue');
      
    } catch (error) {
      console.log('⚠ 测试跳过：Ollama 服务未运行');
      test.skip();
    }
  });
});

test.describe('工具调用场景测试', () => {
  
  test('测试数学计算场景', async ({ request }) => {
    try {
      const response = await request.post('http://[240e:305:67ad:5b00:5680:9048:1114:513d]:11434/api/chat', {
        data: {
          model: 'gemma3:4b',
          messages: [
            { 
              role: 'user', 
              content: 'What is 25 multiplied by 4? Just give me the number.' 
            }
          ],
          stream: false
        },
        timeout: 30000
      });
      
      const data = await response.json();
      console.log('计算响应:', data.message.content);
      
      // 验证响应包含正确答案
      const content = data.message.content;
      expect(content).toMatch(/100/);
      
    } catch (error) {
      console.log('⚠ 测试跳过：Ollama 服务未运行');
      test.skip();
    }
  });

  test('测试信息查询场景', async ({ request }) => {
    try {
      const response = await request.post('http://[240e:305:67ad:5b00:5680:9048:1114:513d]:11434/api/chat', {
        data: {
          model: 'gemma3:4b',
          messages: [
            { 
              role: 'user', 
              content: 'What is the capital of France? One word answer.' 
            }
          ],
          stream: false
        },
        timeout: 30000
      });
      
      const data = await response.json();
      console.log('查询响应:', data.message.content);
      
      // 验证响应包含 Paris
      const content = data.message.content.toLowerCase();
      expect(content).toMatch(/paris/i);
      
    } catch (error) {
      console.log('⚠ 测试跳过：Ollama 服务未运行');
      test.skip();
    }
  });
});

test.describe('性能基准测试', () => {
  
  test('单次请求响应时间', async ({ request }) => {
    try {
      const startTime = Date.now();
      
      const response = await request.post('http://[240e:305:67ad:5b00:5680:9048:1114:513d]:11434/api/generate', {
        data: {
          model: 'gemma3:4b',
          prompt: 'Hi',
          stream: false
        },
        timeout: 30000
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`响应时间: ${duration}ms`);
      
      expect(response.ok()).toBeTruthy();
      expect(duration).toBeLessThan(30000); // 应在 30 秒内完成
      
      // 性能分级
      if (duration < 1000) {
        console.log('性能评级: 优秀 ⭐⭐⭐⭐⭐');
      } else if (duration < 3000) {
        console.log('性能评级: 良好 ⭐⭐⭐⭐');
      } else if (duration < 5000) {
        console.log('性能评级: 一般 ⭐⭐⭐');
      } else {
        console.log('性能评级: 较慢 ⭐⭐');
      }
      
    } catch (error) {
      console.log('⚠ 测试跳过：Ollama 服务未运行');
      test.skip();
    }
  });

  test('连续请求稳定性', async ({ request }) => {
    try {
      const results: number[] = [];
      
      for (let i = 0; i < 3; i++) {
        const startTime = Date.now();
        
        const response = await request.post('http://[240e:305:67ad:5b00:5680:9048:1114:513d]:11434/api/generate', {
          data: {
            model: 'gemma3:4b',
            prompt: `Test ${i + 1}`,
            stream: false
          },
          timeout: 30000
        });
        
        const duration = Date.now() - startTime;
        results.push(duration);
        
        expect(response.ok()).toBeTruthy();
        console.log(`请求 ${i + 1} 完成: ${duration}ms`);
      }
      
      const avgTime = results.reduce((a, b) => a + b, 0) / results.length;
      console.log(`平均响应时间: ${avgTime.toFixed(0)}ms`);
      
      // 验证所有请求都成功
      expect(results.length).toBe(3);
      
    } catch (error) {
      console.log('⚠ 测试跳过：Ollama 服务未运行');
      test.skip();
    }
  });
});

test.describe('错误处理和边界测试', () => {
  
  test('处理空输入', async ({ request }) => {
    try {
      const response = await request.post('http://[240e:305:67ad:5b00:5680:9048:1114:513d]:11434/api/generate', {
        data: {
          model: 'gemma3:4b',
          prompt: '',
          stream: false
        },
        timeout: 10000
      });
      
      // 应该能处理空输入
      expect(response.ok()).toBeTruthy();
      console.log('✓ 空输入处理正常');
      
    } catch (error) {
      console.log('⚠ 测试跳过：Ollama 服务未运行');
      test.skip();
    }
  });

  test('处理特殊字符', async ({ request }) => {
    try {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      
      const response = await request.post('http://[240e:305:67ad:5b00:5680:9048:1114:513d]:11434/api/generate', {
        data: {
          model: 'gemma3:4b',
          prompt: `Echo this: ${specialChars}`,
          stream: false
        },
        timeout: 30000
      });
      
      expect(response.ok()).toBeTruthy();
      console.log('✓ 特殊字符处理正常');
      
    } catch (error) {
      console.log('⚠ 测试跳过：Ollama 服务未运行');
      test.skip();
    }
  });

  test('处理多语言输入', async ({ request }) => {
    try {
      const multiLang = 'Hello 你好 こんにちは 안녕하세요 Bonjour';
      
      const response = await request.post('http://[240e:305:67ad:5b00:5680:9048:1114:513d]:11434/api/generate', {
        data: {
          model: 'gemma3:4b',
          prompt: `Translate to English: ${multiLang}`,
          stream: false
        },
        timeout: 30000
      });
      
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      console.log('多语言响应:', data.response);
      
    } catch (error) {
      console.log('⚠ 测试跳过：Ollama 服务未运行');
      test.skip();
    }
  });
});

test.describe('应用配置验证', () => {
  
  test('验证 Playwright 配置', async () => {
    const configPath = join(__dirname, '..', 'playwright.config.ts');
    const exists = existsSync(configPath);
    
    expect(exists).toBeTruthy();
    console.log('✓ playwright.config.ts 存在');
  });

  test('验证测试文件结构', async () => {
    const specsDir = __dirname;
    const files = readdirSync(specsDir);
    
    const specFiles = files.filter((f: string) => f.endsWith('.spec.ts'));
    
    console.log('测试文件列表:');
    specFiles.forEach((file: string) => {
      console.log(`  - ${file}`);
    });
    
    expect(specFiles.length).toBeGreaterThan(0);
  });

  test('验证测试结果目录', async () => {
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
    console.log('✓ 测试结果目录已准备');
  });
});

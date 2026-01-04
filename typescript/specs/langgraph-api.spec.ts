import { test, expect } from '@playwright/test';

/**
 * LangGraph 应用自动化测试
 * 测试本地运行的 LangGraph 应用的各种功能
 */

test.describe('LangGraph 多轮对话测试', () => {
  
  test.skip('启动多轮对话应用', async ({ page }) => {
    // 注意：这个测试需要先启动 web 服务
    // 如果你的应用有 web 界面，可以这样测试
    
    await page.goto('http://[240e:305:67ad:5b00:5680:9048:1114:513d]:3000');
    
    // 等待聊天界面加载
    const chatInput = page.locator('input[type="text"], textarea');
    await expect(chatInput).toBeVisible();
    
    // 发送第一条消息
    await chatInput.fill('你好，请介绍一下自己');
    await page.keyboard.press('Enter');
    
    // 等待 AI 响应
    await page.waitForTimeout(3000);
    
    // 验证响应出现
    const messages = page.locator('.message, .chat-message');
    await expect(messages).toHaveCount(2); // 用户消息 + AI 响应
    
    // 发送第二条消息
    await chatInput.fill('你能做什么？');
    await page.keyboard.press('Enter');
    
    await page.waitForTimeout(3000);
    
    // 验证多轮对话
    await expect(messages).toHaveCount(4);
  });
});

test.describe('命令行应用测试（通过 API）', () => {
  
  test('测试 Ollama API 连接', async ({ request }) => {
    // 测试 Ollama 服务是否可用
    const response = await request.get('http://[240e:305:67ad:5b00:5680:9048:1114:513d]:11434/api/tags');
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    console.log('可用的模型:', data);
    
    // 验证有可用的模型
    expect(data.models).toBeDefined();
    expect(data.models.length).toBeGreaterThan(0);
  });

  test('测试 Ollama 生成接口', async ({ request }) => {
    const response = await request.post('http://[240e:305:67ad:5b00:5680:9048:1114:513d]:11434/api/generate', {
      data: {
        model: 'gemma3:4b',
        prompt: 'Hello, how are you?',
        stream: false
      },
      timeout: 30000
    });
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    console.log('AI 响应:', data.response);
    
    expect(data.response).toBeDefined();
    expect(data.response.length).toBeGreaterThan(0);
  });

  test('测试 Ollama 聊天接口', async ({ request }) => {
    const response = await request.post('http://[240e:305:67ad:5b00:5680:9048:1114:513d]:11434/api/chat', {
      data: {
        model: 'gemma3:4b',
        messages: [
          { role: 'user', content: '什么是 LangGraph？' }
        ],
        stream: false
      },
      timeout: 30000
    });
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    console.log('聊天响应:', data.message.content);
    
    expect(data.message).toBeDefined();
    expect(data.message.content).toBeDefined();
  });

  test('测试多轮对话上下文', async ({ request }) => {
    // 第一轮对话
    const response1 = await request.post('http://[240e:305:67ad:5b00:5680:9048:1114:513d]:11434/api/chat', {
      data: {
        model: 'gemma3:4b',
        messages: [
          { role: 'user', content: '我的名字是张三' }
        ],
        stream: false
      },
      timeout: 30000
    });
    
    const data1 = await response1.json();
    console.log('第一轮响应:', data1.message.content);
    
    // 第二轮对话（测试上下文记忆）
    const response2 = await request.post('http://[240e:305:67ad:5b00:5680:9048:1114:513d]:11434/api/chat', {
      data: {
        model: 'gemma3:4b',
        messages: [
          { role: 'user', content: '我的名字是张三' },
          { role: 'assistant', content: data1.message.content },
          { role: 'user', content: '我叫什么名字？' }
        ],
        stream: false
      },
      timeout: 30000
    });
    
    const data2 = await response2.json();
    console.log('第二轮响应:', data2.message.content);
    
    // 验证 AI 记住了名字
    expect(data2.message.content.toLowerCase()).toContain('张三');
  });
});

test.describe('工具调用功能测试', () => {
  
  test('测试天气查询工具', async ({ request }) => {
    const response = await request.post('http://[240e:305:67ad:5b00:5680:9048:1114:513d]:11434/api/chat', {
      data: {
        model: 'gemma3:4b',
        messages: [
          { 
            role: 'user', 
            content: '北京今天天气怎么样？' 
          }
        ],
        stream: false
      },
      timeout: 30000
    });
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    console.log('天气查询响应:', data.message.content);
    
    // 验证响应包含天气相关信息
    const content = data.message.content.toLowerCase();
    expect(
      content.includes('天气') || 
      content.includes('温度') || 
      content.includes('weather')
    ).toBeTruthy();
  });

  test('测试计算工具', async ({ request }) => {
    const response = await request.post('http://[240e:305:67ad:5b00:5680:9048:1114:513d]:11434/api/chat', {
      data: {
        model: 'gemma3:4b',
        messages: [
          { 
            role: 'user', 
            content: '计算 123 + 456 等于多少？' 
          }
        ],
        stream: false
      },
      timeout: 30000
    });
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    console.log('计算响应:', data.message.content);
    
    // 验证响应包含正确答案
    expect(data.message.content).toContain('579');
  });
});

test.describe('性能和稳定性测试', () => {
  
  test('并发请求测试', async ({ request }) => {
    const promises = [];
    
    // 发送 5 个并发请求
    for (let i = 0; i < 5; i++) {
      promises.push(
        request.post('http://[240e:305:67ad:5b00:5680:9048:1114:513d]:11434/api/generate', {
          data: {
            model: 'gemma3:4b',
            prompt: `测试消息 ${i + 1}`,
            stream: false
          },
          timeout: 60000
        })
      );
    }
    
    const responses = await Promise.all(promises);
    
    // 验证所有请求都成功
    responses.forEach((response, index) => {
      expect(response.ok()).toBeTruthy();
      console.log(`请求 ${index + 1} 完成`);
    });
  });

  test('长文本处理测试', async ({ request }) => {
    const longText = '这是一段很长的文本。'.repeat(100);
    
    const response = await request.post('http://[240e:305:67ad:5b00:5680:9048:1114:513d]:11434/api/generate', {
      data: {
        model: 'gemma3:4b',
        prompt: `请总结以下内容：${longText}`,
        stream: false
      },
      timeout: 60000
    });
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.response).toBeDefined();
    console.log('长文本处理完成，响应长度:', data.response.length);
  });

  test('响应时间测试', async ({ request }) => {
    const startTime = Date.now();
    
    const response = await request.post('http://[240e:305:67ad:5b00:5680:9048:1114:513d]:11434/api/generate', {
      data: {
        model: 'gemma3:4b',
        prompt: 'Hello',
        stream: false
      },
      timeout: 30000
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`响应时间: ${duration}ms`);
    
    expect(response.ok()).toBeTruthy();
    
    // 验证响应时间在合理范围内（30秒内）
    expect(duration).toBeLessThan(30000);
  });
});

test.describe('错误处理测试', () => {
  
  test('测试无效模型名称', async ({ request }) => {
    const response = await request.post('http://[240e:305:67ad:5b00:5680:9048:1114:513d]:11434/api/generate', {
      data: {
        model: 'invalid-model-name',
        prompt: 'Hello',
        stream: false
      },
      timeout: 10000,
      failOnStatusCode: false
    });
    
    // 应该返回错误
    expect(response.ok()).toBeFalsy();
    console.log('错误状态码:', response.status());
  });

  test('测试空提示词', async ({ request }) => {
    const response = await request.post('http://[240e:305:67ad:5b00:5680:9048:1114:513d]:11434/api/generate', {
      data: {
        model: 'gemma3:4b',
        prompt: '',
        stream: false
      },
      timeout: 10000
    });
    
    // 即使提示词为空，API 也应该能处理
    expect(response.ok()).toBeTruthy();
  });

  test('测试超长提示词', async ({ request }) => {
    const veryLongPrompt = 'a'.repeat(10000);
    
    const response = await request.post('http://[240e:305:67ad:5b00:5680:9048:1114:513d]:11434/api/generate', {
      data: {
        model: 'gemma3:4b',
        prompt: veryLongPrompt,
        stream: false
      },
      timeout: 60000,
      failOnStatusCode: false
    });
    
    // 记录响应状态
    console.log('超长提示词响应状态:', response.status());
  });
});

import { DeepSeekClient } from './deepseek-client';

describe('DeepSeekClient', () => {
  // 该用例真实调用 DeepSeek API（集成测试），需放宽 Vitest 默认的 5s 超时
  it('should generate a response', async () => {
    const client = new DeepSeekClient({ apiKey: process.env.DEEPSEEK_API_KEY! });

    const result = await client.chat(
      [
        {
          role: 'user',
          content: '北京适合什么时候旅游？',
        },
      ],
      // 集成测试只需验证链路连通，限制输出长度以保证耗时稳定（网络延迟较高时短回复仍需数秒）
      { maxOutputTokens: 100 },
    );

    expect(result.content).toBeTruthy();

    console.log( result.content );
  }, 30_000);
})
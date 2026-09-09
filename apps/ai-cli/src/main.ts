/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

// import { Logger } from '@nestjs/common';
// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app/app.module';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
//   const globalPrefix = 'api';
//   app.setGlobalPrefix(globalPrefix);
//   const port = process.env.PORT || 3000;
//   await app.listen(port);
//   Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
// }

// bootstrap();

import { generateText } from 'ai';
import { deepseek } from '@ai-sdk/deepseek';
import * as readline from 'readline';
import * as dotenv from 'dotenv';

// 加载 .env 文件的环境变量
dotenv.config();

// 创建 readline 接口用于获取用户输入
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// 将用户输入转换为 Promise
const question = (query: string): Promise<string> => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log('🤖 DeepSeek CLI 已启动 (输入 "exit" 退出)');

  while (true) {
    const userInput = await question('\n你：');

    if (userInput.toLowerCase() === 'exit') {
      console.log('👋 再见!');
      rl.close();
      break;
    }

    // 检查 API Key 是否已配置
    if (!process.env.DEEPSEEK_API_KEY) {
      console.error('❌ 错误: 请在 .env 文件中设置 DEEPSEEK_API_KEY');
      rl.close();
      break;
    }

    try {
      // 调用 DeepSeek 模型生成回答
      const { text } = await generateText({
        model: deepseek('deepseek-chat'),
        prompt: userInput,
      });

      console.log(`\n🤖 DeepSeek: ${text}`);
    } catch (error) {
      console.error('❌ 发生错误:', error);
    }
  }
}

main().catch(console.error);
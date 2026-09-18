import { generateText, streamText } from 'ai';
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

// async function main() {
//   console.log('🤖 DeepSeek CLI 已启动 (输入 "exit" 退出)');

//   while (true) {
//     const userInput = await question('\n你：');

//     if (userInput.toLowerCase() === 'exit') {
//       console.log('👋 再见!');
//       rl.close();
//       break;
//     }

//     // 检查 API Key 是否已配置
//     if (!process.env.DEEPSEEK_API_KEY) {
//       console.error('❌ 错误: 请在 .env 文件中设置 DEEPSEEK_API_KEY');
//       rl.close();
//       break;
//     }

//     try {
//       // 调用 DeepSeek 模型生成回答
//       const { text } = await generateText({
//         model: deepseek('deepseek-chat'),
//         prompt: userInput,
//       });

//       console.log(`\n🤖 DeepSeek: ${text}`);
//     } catch (error) {
//       console.error('❌ 发生错误:', error);
//     }
//   }
// }

// main().catch(console.error);

async function streamMain() {
  console.log('🤖 DeepSeek CLI（流式） 已启动 (输入 "exit" 退出)');

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
      // 发起流式请求（AI SDK v7 的 streamText 同步返回 StreamTextResult，无需 await）
      const stream = streamText({
        model: deepseek('deepseek-chat'),
        prompt: userInput,
      });

      // 逐字（块）打印
      process.stdout.write('\n🤖 DeepSeek: ');

      // 使用 textStream 迭代每个文本块
      for await (const chunk of stream.textStream) {
        process.stdout.write(chunk); // 直接写入，不换行
      }

      // 流结束后换行，使下一次输入提示新起一行
      console.log('\n');

    } catch (error) {
      console.error('❌ 发生错误:', error);
    }
  }
}

streamMain().catch(console.error);

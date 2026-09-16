import { generateText, stepCountIs } from 'ai';
import { deepseek } from '@ai-sdk/deepseek';
import { SearchService, providers, createWebSearchTool } from '../../tools/web-search/index';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const provider = new providers.tavily(process.env.TAVILY_API_KEY!);
  const searchService = new SearchService(provider);
  const webSearch = createWebSearchTool(searchService);
  
  const result = await generateText({
    model: deepseek(process.env.DEEPSEEK_MODEL!),
    prompt: `
  你是一名 Research Agent。
  
  研究问题：
  
  2026年北京适合第一次旅行的区域有哪些？
    `,
    tools: {
      webSearch
    },
    stopWhen: stepCountIs(5),
  })

  console.log('result', result)
}

main().catch((err) => {
  console.log('err', err);
  process.exit(1);
});

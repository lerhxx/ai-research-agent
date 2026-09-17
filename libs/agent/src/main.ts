import { generateText, stepCountIs } from 'ai';
import { deepseek } from '@ai-sdk/deepseek';
import { SearchService, providers, createWebSearchTool } from '../../tools/web-search/index';
import { ExtractService, providers as extractProviders, createURLExtractTool } from '../../tools/url-extract/index';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const provider = new providers.tavily(process.env.TAVILY_API_KEY!);
  const searchService = new SearchService(provider);
  const webSearch = createWebSearchTool(searchService);

  const extractProvider = new extractProviders.tavily(process.env.TAVILY_API_KEY!);
  const extractervice = new ExtractService(extractProvider);
  const urlExtract = createURLExtractTool(extractervice);
  
  const result = await generateText({
    model: deepseek(process.env.DEEPSEEK_MODEL!),
    prompt: `
  你是一名 Research Agent。
  
  研究问题：
  
  2026年北京适合第一次旅行的区域。

  要求：
  1. 搜索互联网
  2. 找到可靠来源
  3. 对重要来源进行网页内容提取
  4. 根据提取后的内容进行总结
  5. 给出来源
    `,
    tools: {
      webSearch,
      urlExtract
    },
    stopWhen: stepCountIs(8),
  })

  console.log('result', result)
}

main().catch((err) => {
  console.log('err', err);
  process.exit(1);
});

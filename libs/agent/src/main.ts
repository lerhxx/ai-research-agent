import { generateText, stepCountIs } from 'ai';
import { deepseek } from '@ai-sdk/deepseek';
import { SearchService, providers, createWebSearchTool } from '../../tools/web-search/index';
import { ExtractService, providers as extractProviders, createURLExtractTool } from '../../tools/url-extract/index';
import { telemetry, RunContext } from '../../observability/index';
import { DeepSeekClient } from '../../llm/deepseek/deepseek-client';
import * as dotenv from 'dotenv';

dotenv.config();

function plan() {
  return `
    你是一名 Research Agent。
    
    研究问题：
    
    2026年南京适合第一次旅行的区域。

    要求：
    1. 搜索互联网
    2. 找到可靠来源
    3. 对重要来源进行网页内容提取
    4. 根据提取后的内容进行总结
    5. 给出来源
  `
}

async function researchSources(plan: string, runContext: RunContext) {
  const provider = new providers.tavily(process.env.TAVILY_API_KEY!);
  const searchService = new SearchService(provider);
  const webSearch = createWebSearchTool(searchService, runContext);

  const extractProvider = new extractProviders.tavily(process.env.TAVILY_API_KEY!);
  const extractService = new ExtractService(extractProvider);
  const urlExtract = createURLExtractTool(extractService, runContext);

  const model = deepseek(process.env.DEEPSEEK_MODEL!);
  // const client = new DeepSeekClient({ apiKey: process.env.DEEPSEEK_API_KEY! });

  telemetry.trackLLMCall({ 
    context: runContext, 
    provider: provider.name,
    // model: client.model,
    model: model.modelId,
    startedAt: Date.now(),
  })

  // return await client.chat(
  //     [{
  //       role: 'user',
  //       content: plan,
  //     }],
  //     {
  //       // maxOutputTokens: 100,
  //       tools: { webSearch, urlExtract  },
  //     }
  //   )

  return await generateText({
    model,
    prompt: plan,
    tools: {
      webSearch,
      urlExtract
    },
    stopWhen: stepCountIs(8),
  });
  
}

function logRunSummary() {
  const events = telemetry.getEvents();
  for (const event of events) {
    event.runId && console.log('run summary', telemetry.getRunSummary(event.runId));
  }
}

async function main() {
  const query = plan();
  const runContext = telemetry.startRun({ agentName: 'research-agent', query });
  
  try {
    const result = await researchSources(query, runContext);
    console.log('result', result);
  
    telemetry.completeRun(runContext, result);

    // logRunSummary();
  
    return result;
  } catch(err) {
    telemetry.failRun(runContext, err);

    throw err;
  }
}

main().catch((err) => {
  console.log('err', err);
  process.exit(1);
});

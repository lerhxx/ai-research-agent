import { generateText, stepCountIs, tool, type ToolSet } from 'ai';
import { deepseek } from '@ai-sdk/deepseek';
import { SearchService, webSearchProviders, createWebSearchTool } from '../../tools/web-search/index';
import { ExtractService, urlExtractProviders, createURLExtractTool } from '../../tools/url-extract/index';
import { telemetry, RunContext } from '../../observability/index';
import { DeepSeekClient } from '../../llm/deepseek/deepseek-client';
import { Tool, ToolRegistry, createToolRegistry } from '../../tools';

import * as dotenv from 'dotenv';

dotenv.config();

const SystemPrompt = `
  你是一名 Research Agent。
  
  你的任务是：
  1. 理解用户研究问题
  2. 必要时调用工具搜索信息
  3. 对信息进行分析
  4. 最终给出结构化回答
  5. 给出来源

  如果需要实时信息，优先使用 web_search。
  如果需要读取具体网页内容，使用 url_extract。
`

function toAISDKTools(tools: Tool[], runContext: RunContext): ToolSet {
  const result: ToolSet = {};
  for (const currentTool of tools) {
    result[currentTool.name] = tool({
      description: currentTool.description,
      inputSchema: currentTool.inputSchema,
      execute: async (options) => currentTool.execute(options, { run: runContext }),
    })
  }

  return result;
}

export class ResearchAgent {
  constructor(
    private readonly llm: DeepSeekClient,
    private readonly toolRegistry: ToolRegistry
  ) {}

  async run(query: string) {
    const runContext = telemetry.startRun({ agentName: 'research-agent', query });

    try {
      const model = deepseek(process.env.DEEPSEEK_MODEL!);
      const tools = toAISDKTools(this.toolRegistry.getAll(), runContext);

      telemetry.trackLLMCall({ 
        context: runContext, 
        provider: 'deepseek',
        // model: client.model,
        model: model.modelId,
        startedAt: Date.now(),
      })

      const result = await this.llm.chat([
        {
          role: 'system',
          content: SystemPrompt
        },
        {
          role: 'user',
          content: query,
        },
      ], {
        tools,
        stopWhen: stepCountIs(8),
      });

      telemetry.completeRun(runContext, result);
      console.log('run summary', telemetry.getRunSummary(runContext.runId));

      return result;
    } catch(error) {
      telemetry.failRun(runContext, error);

      throw error;
    }
  }
}

async function main() {
  const provider = new webSearchProviders.tavily(process.env.TAVILY_API_KEY!);
  const searchService = new SearchService(provider);

  const extractProvider = new urlExtractProviders.tavily(process.env.TAVILY_API_KEY!);
  const extractService = new ExtractService(extractProvider);

  const toolDependencies = {
    searchService: searchService,
    urlExtractService: extractService,
  }

  const agent = new ResearchAgent(new DeepSeekClient(), createToolRegistry(toolDependencies));
  await agent.run('2026年南京适合第一次旅行的区域。');
}

main().catch((err) => {
  console.log('err', err);
  process.exit(1);
});

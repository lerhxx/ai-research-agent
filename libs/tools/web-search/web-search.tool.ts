import { tool } from 'ai';
import { z } from 'zod';
import { SearchService } from './core/search-service';
import { telemetry, RunContext } from '../../observability/index';

const Description = `
Search the web for reliable and up-to-date information.

Use this tool when:
- You need current information.
- You need factual evidence.
- You need sources for a research report.
- The answer cannot be reliably generated from model knowledge alone.

Do not use this tool for simple reasoning or writing tasks.
    `

const InputSchema = z.object({
  query: z.string()
          .min(2)
          .describe('A precise web search query'),
  maxResults: z.number()
                .int()
                .min(1)
                .max(10)
                .default(5),
  searchDepth: z.enum([
                  'basic',
                  'fast',
                  'advanced'
                ])
                .default('basic'),
  topic: z.enum([
          'general',
          'news',
          'finance'
        ])
        .default('general'),
  timeRange: z.enum([
              'day',
              'week',
              'month',
              'year',
            ])
            .optional(),
  includeDomains: z.array(z.string())
                    .optional(),
  excludeDomains: z.array(z.string())
                    .optional(),
})

export const createWebSearchTool = (
  searchService: SearchService,
  runContext: RunContext,
) => tool({
    description: Description,
    inputSchema: InputSchema,
    execute: async ({
      query,
      maxResults,
      searchDepth,
      topic,
      timeRange,
      includeDomains,
      excludeDomains,
    }) => {
      const startedAt = Date.now();
      try {
        const result = await searchService.search({
          query,
          maxResults,
          searchDepth,
          topic,
          timeRange,
          includeDomains,
          excludeDomains,
        });
  
        telemetry.trackToolCall({
          context: runContext,
          toolName: 'web_search',
          startedAt,
          input: { query },
          result: { itemCount: result.results.length },
          status: 'success',
        });
  
        return result;
      } catch(err){
        telemetry.trackToolCall({
          context: runContext,
          toolName: 'web_search',
          startedAt,
          input: { query },
          status: 'error',
        });

        throw err;
      }
    }
  })
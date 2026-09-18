import { tool } from 'ai';
import { z } from 'zod';
import { SearchService } from './core/search-service';
import { SearchOptions } from './core/types';
import { telemetry, RunContext } from '../../observability/index';
import type { Tool } from '../core/types';

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
    }) => telemetry.trackTool({
      context: runContext,
      toolName: 'web_search',
      input: { query },
      execute: async () => await searchService.search({
        query,
        maxResults,
        searchDepth,
        topic,
        timeRange,
        includeDomains,
        excludeDomains,
      }),
      getResultMeta: (result) => ({ itemCount: result.results.length }),
    })
  })

export class WebSearchTool implements Tool<typeof InputSchema, Awaited<ReturnType<SearchService['search']>>> {
  readonly name = 'web_search';
  readonly description = Description;
  readonly inputSchema = InputSchema;
  
  constructor(private readonly searchService: SearchService) {}

  async execute(
    options: SearchOptions,
    context: { run: RunContext },
  ) {
    const {
      query,
      maxResults,
      searchDepth,
      topic,
      timeRange,
      includeDomains,
      excludeDomains,
    } = options;
    return telemetry.trackTool({
      context: context.run,
      toolName: this.name,
      input: { query },
      execute: () => this.searchService.search({
        query,
        maxResults,
        searchDepth,
        topic,
        timeRange,
        includeDomains,
        excludeDomains,
      }),
      getResultMeta: (result) => ({ itemCount: result.results.length }),
    });
  }
}
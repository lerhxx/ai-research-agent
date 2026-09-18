import { tool } from 'ai';
import { z } from 'zod';
import { ExtractService } from './core/extract-service';
import { ExtractOptions } from './core/types';
import { telemetry, RunContext } from '../../observability/index';
import type { Tool } from '../core/types';

const Description = `
Extract the main content from one or more web pages.

Use this tool when:
- You already have a URL from web search.
- You need the full content of a source.
- You need detailed evidence from a webpage.
- Search result snippets are not sufficient.

Do not use this tool when you only need to discover webpages.
    `

const InputSchema = z.object({
  urls: z.array(z.url())
         .min(1)
         .max(20)
         .describe('URLs of webpages to extract'),
  extractDepth: z.enum(['basic', 'advanced'])
                 .default('basic'),
  format: z.enum(['markdown', 'text'])
           .default('markdown'),
  includeImages: z.boolean().default(false),
})

export const createURLExtractTool = (
  extractService: ExtractService,
  runContext: RunContext,
) => tool({
    description: Description,
    inputSchema: InputSchema,
    execute: async ({
      urls,
      extractDepth,
      format,
      includeImages,
    }) => telemetry.trackTool({
      context: runContext,
      toolName: 'url_extract',
      input: { urls },
      execute: async () => await extractService.extract({
        urls,
        extractDepth,
        format,
        includeImages,
      }),
      getResultMeta: (result) => ({ itemCount: result.results.length }),
    })
  });

export class URLExtractTool implements Tool<typeof InputSchema, Awaited<ReturnType<ExtractService['extract']>>> {
  readonly name = 'url_extract';
  readonly description = Description;
  readonly inputSchema = InputSchema;
  
  constructor(private readonly extractService: ExtractService) {}

  async execute(
    options: ExtractOptions,
    context: { run: RunContext },
  ) {
    const {
      urls,
      extractDepth,
      format,
      includeImages,
    } = options;
    return telemetry.trackTool({
      context: context.run,
      toolName: this.name,
      input: { urls },
      execute: () => this.extractService.extract({
        urls,
        extractDepth,
        format,
        includeImages,
      }),
      getResultMeta: (result) => ({ itemCount: result.results.length }),
    });
  }
}
import { tool } from 'ai';
import { z } from 'zod';
import { ExtractService } from './core/extract-service';
import { telemetry, RunContext } from '../../observability/index';

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
    }) => {
      const startedAt = Date.now();
      try {
        const result = await extractService.extract({
          urls,
          extractDepth,
          format,
          includeImages,
        });
  
        telemetry.trackToolCall({
          context: runContext,
          toolName: 'url_extract',
          startedAt,
          input: { urls },
          result: { bytes: result.results.length, },
          status: 'success',
        });

        return result;
      } catch(err) {
        telemetry.trackToolCall({
          context: runContext,
          toolName: 'url_extract',
          startedAt,
          input: { urls },
          status: 'error',
        });

        throw err;
      }
    }
  });
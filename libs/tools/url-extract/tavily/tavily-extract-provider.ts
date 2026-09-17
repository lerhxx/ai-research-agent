import { tavily } from '@tavily/core';

import type {
  ExtractOptions,
  ExtractResponse,
} from '../core/types';

import type { ExtractProvider } from '../core/extract-provider';

export class TavilyExtractProvider implements ExtractProvider {
  private readonly client;

  constructor(apiKey: string) {
    this.client = tavily({ apiKey, })
  }

  async extract( options: ExtractOptions ): Promise<ExtractResponse> {
    const response = await this.client.extract(
      options.urls,
      {
        extractDepth: options.extractDepth ?? 'basic',
        format: options.format ?? 'markdown',
        includeImages: options.includeImages ?? false,
      },
    );

    return {
      results: response.results.map((item) => ({
        url: item.url,
        content: item.rawContent,
        images: item.images,
      })),
      failedResults: response.failedResults.map((item) => ({
        url: item.url,
        error: item.error,
      })),
    };
  }
}
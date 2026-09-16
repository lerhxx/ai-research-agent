import { tavily } from '@tavily/core';

import type {
  SearchOptions,
  SearchResponse,
} from '../core/types';

import type { SearchProvider } from '../core/search-provider';

export class TavilySearchProvider implements SearchProvider {
  private readonly client;

  constructor(apiKey: string) {
    this.client = tavily({ apiKey, })
  }

  async search( options: SearchOptions ): Promise<SearchResponse> {
    const response = await this.client.search(
      options.query,
      {
        maxResults: options.maxResults ?? 5,
        searchDepth: options.searchDepth ?? 'basic',
        topic: options.topic ?? 'general',
        timeRange: options.timeRange,
        includeDomains: options.includeDomains,
        excludeDomains: options.excludeDomains,
        includeAnswer: false,
        includeRawContent: false,
      },
    );

    return {
      query: response.query,
      results: response.results.map((item) => ({
        title: item.title,
        url: item.url,
        content: item.content,
        score: item.score,
        publishedDate: item.publishedDate,
      })),
    };
  }
}
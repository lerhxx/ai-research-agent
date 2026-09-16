import type { SearchProvider } from './search-provider';
import type {
  SearchOptions,
  SearchResponse,
} from './types';

export class SearchService {
  constructor(private readonly provider: SearchProvider) {}

  async search(
    options: SearchOptions,
  ): Promise<SearchResponse> {
    const response = await this.provider.search(options);

    return {
      ...response,
      results: this.dedupeResults(response.results,)
    }
  }

  /** URL 去重 */
  private dedupeResults(results: SearchResponse['results']) {
    const seen = new Set<string>();

    return results.filter((item) => {
      if (seen.has(item.url)) {
        return false;
      }

      seen.add(item.url);

      return true;
    })
  }
}
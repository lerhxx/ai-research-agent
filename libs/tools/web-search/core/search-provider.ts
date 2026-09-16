import type {
  SearchOptions,
  SearchResponse,
} from './types';

export interface SearchProvider {
  search(
    options: SearchOptions,
  ): Promise<SearchResponse>;
}

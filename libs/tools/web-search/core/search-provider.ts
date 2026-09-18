import type {
  SearchOptions,
  SearchResponse,
} from './types';

export interface SearchProvider {
  name: string;
  search(
    options: SearchOptions,
  ): Promise<SearchResponse>;
}

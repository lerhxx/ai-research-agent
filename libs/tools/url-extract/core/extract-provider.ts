import type {
  ExtractOptions,
  ExtractResponse,
} from './types';

export interface ExtractProvider {
  extract(
    options: ExtractOptions,
  ): Promise<ExtractResponse>;
}

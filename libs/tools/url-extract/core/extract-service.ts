import type { ExtractProvider } from './extract-provider';
import type {
  ExtractOptions,
  ExtractResponse,
} from './types';

export class ExtractService {
  constructor(private readonly provider: ExtractProvider) {}

  async extract(
    options: ExtractOptions,
  ): Promise<ExtractResponse> {
    if (!options.urls.length) {
      throw new Error( 'At least one URL is required' );
    }

    if (options.urls.length > 20) {
      throw new Error( 'A maximum of 20 URLs can be extracted at once' );
    }

    return this.provider.extract(options);
  }
}
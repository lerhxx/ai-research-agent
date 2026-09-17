export interface ExtractOptions {
  urls: string[];
  extractDepth?: 'basic' | 'advanced';
  format?: 'markdown' | 'text';
  includeImages?: boolean;
}

export interface ExtractDocument {
  url: string;
  content: string;
  images?: string[];
}

export interface ExtractResponse {
  results: ExtractDocument[];
  failedResults: {
    url: string;
    error?: string;
  }[];
}
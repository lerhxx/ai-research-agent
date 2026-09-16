export interface SearchOptions {
  query: string;
  maxResults?: number;
  searchDepth?: 'basic' | 'fast' | 'advanced';
  topic?: 'general' | 'news' | 'finance';
  timeRange?: 'day' | 'week' | 'month' | 'year';
  includeDomains?: string[];
  excludeDomains?: string[];
}

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  scroe?: number;
  publishedDate?: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  answer?: string;
}
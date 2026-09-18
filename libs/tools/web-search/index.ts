import { TavilySearchProvider } from './tavily/tavily-search-provider';

export { SearchService } from './core/search-service';

export { createWebSearchTool, WebSearchTool } from './web-search.tool';

const providers = {
  tavily: TavilySearchProvider
}

export {
  providers as webSearchProviders
}

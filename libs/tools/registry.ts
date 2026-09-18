import { ToolRegistry } from './core';
import { WebSearchTool } from './web-search';
import { URLExtractTool } from './url-extract';

export interface ToolDependencies {
  searchService: ConstructorParameters<
    typeof WebSearchTool
  >[0];

  urlExtractService:
    ConstructorParameters<
      typeof URLExtractTool
    >[0];
}

export function createToolRegistry(
  dependencies: ToolDependencies,
): ToolRegistry {
  const registry =
    new ToolRegistry();

  registry.registers([
    new WebSearchTool(
      dependencies.searchService,
    ),

    new URLExtractTool(
      dependencies.urlExtractService,
    ),
  ]);

  return registry;
}
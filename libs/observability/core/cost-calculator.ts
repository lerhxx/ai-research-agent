import { Cost, ModelPricing, TokenUsage } from './types';

export function calculateLLMCost(pricing: ModelPricing, usage: TokenUsage): Cost {
  const input = (usage.inputTokens / 1_000_000) * pricing.inputPerMillionTokens;

  const output =  (usage.outputTokens / 1_000_000) * pricing.outputPerMillionTokens;

  return {
    input,
    output,
    total: input + output,
    currency: pricing.currency,
  }
}
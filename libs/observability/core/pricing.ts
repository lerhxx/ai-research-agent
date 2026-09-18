import { ModelPricing } from './types';

export const MODEL_PRICING: Record<string, ModelPricing> = {
  'deepseek:deepseek-chat': {
    provider: 'deepseek',
    model: 'deepseek-chat',

    inputPerMillionTokens: 100,
    outputPerMillionTokens: 10,

    currency: 'USD',
  },
}

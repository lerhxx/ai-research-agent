import { LLMOptions, LLMResponse, LLMStreamEvent, Message } from './types';

/** Agent 层只依赖这个接口 */
export interface LLMClient {
  /** 非流式调用 */
  chat(
    messages: Message[],
    options?: LLMOptions
  ): Promise<LLMResponse>;

  /** 流式调用 */
  stream(
    messages: Message[],
    options?: LLMOptions
  ): AsyncGenerator<LLMStreamEvent>;
}

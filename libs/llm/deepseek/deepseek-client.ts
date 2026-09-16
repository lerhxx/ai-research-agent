import {
  generateText,
  streamText,
  type ModelMessage,
} from 'ai';
import { deepseek } from '@ai-sdk/deepseek';

import type { LLMClient } from '../core/llm-client';
import { 
  LLMOptions,
  LLMResponse,
  LLMStreamEvent,
  Message,
  ToolCall,
} from '../core/types';

export interface DeepSeekClientOptions {
  apiKey?: string;
  model?: string;
}

export class DeepSeekClient implements LLMClient {
  private readonly model: string;

  constructor(options: DeepSeekClientOptions = {}) {
    this.model = options.model ?? process.env.DEEPSEEK_MODEL ?? 'deepseek-chat';

    if (!options.apiKey && !process.env.DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY is not configured')
    };
  }

  getConfig(messages: Message[], options: LLMOptions = {}) {
    return {
      model: deepseek(this.model),
      messages: this.toModelMessage(messages),
      temperature: options.temperature,
      topP: options.topP,
      maxOutputTokens: options.maxTokens,
    }
  }

  /** 非流式调用 */
  async chat( messages: Message[], options: LLMOptions = {} ): Promise<LLMResponse> {
    const result = await generateText({
      model: deepseek(this.model),
      messages: this.toModelMessage(messages),
      temperature: options.temperature,
      topP: options.topP,
      maxOutputTokens: options.maxTokens,
    });

    const toolCalls: ToolCall[] = result.toolCalls.map((toolCall) => ({
      id: toolCall.toolCallId,
      type: 'function',
      function: {
        name: toolCall.toolName,
        arguments: JSON.stringify(toolCall.input),
      }
    }));

    return {
      id: result.finalStep.response.id ?? result.finalStep.callId,
      model: this.model,
      content: result.text || null,
      toolCalls,
      finishReason: this.mapFinishReason( result.finishReason ),
      usage: result.usage ? {
        promptTokens: result.usage.inputTokens ?? 0,
        completionTokens: result.usage.outputTokens ?? 0,
        totalTokens: (result.usage.inputTokens ?? 0) + (result.usage.outputTokens ?? 0)
      } : undefined
    }
  }

  /** 流式调用 */
  async *stream( messages: Message[], options: LLMOptions = {} ): AsyncGenerator<LLMStreamEvent> {
    const result = streamText({
      model: deepseek(this.model),
      messages: this.toModelMessage(messages),
      temperature: options.temperature,
      topP: options.topP,
      maxOutputTokens: options.maxTokens,
    })

    for await (const part of result.stream) {
      switch (part.type) {
        /** 普通文本增量 */
        case 'text-delta':
          yield {
            type: 'text_delta',
            content: part.text,
          };
          break;
        /** Tool Call 开始 */
        case 'tool-call':
          yield {
            type: 'tool_call_delta',
            index: 0,
            id: part.toolCallId,
            name: part.toolName,
            arguments: JSON.stringify(part.input),
          };
          break;
        /** 推理内容 */
        case 'reasoning-delta':
          yield {
            type: 'reasoning_delta',
            content: part.text,
          };
          break;
        /** 完成 */
        case 'finish':
          yield {
            type: 'done',
            finishReason: this.mapFinishReason( part.finishReason ),
          };
          break;
        default:
          break;
      }
    }
  }

  /** 将项目内部 Message 转换成 AI SDK ModelMessage */
  private toModelMessage(messages: Message[]): ModelMessage[] {
    return messages.map((message) => {
      switch (message.role) {
        case 'system':
          return {
            role: 'system',
            content: message.content ?? '',
          };

        case 'user':
          return {
            role: 'user',
            content: message.content ?? '',
          };
        
        case 'assistant':
          return {
            role: 'assistant',
            content: message.content ?? '',
          }

        case 'tool': {
          if (!message.toolCallId) {
            throw new Error('Tool message is missing toolCallId');
          }
          return {
            role: 'tool',
            content: [
              {
                type: 'tool-result',
                toolCallId: message.toolCallId,
                toolName: message.name ?? '',
                output: {
                  type: 'text',
                  value: message.content ?? '',
                },
              },
            ],
          };
        }
        
        default:
          throw new Error(
            `Unsupported message role: ${ (message as Message).role }`,
          )
      }
    })
  }

  /** 将 AI SDK finishReason 映射成项目自己的类型 */
  private mapFinishReason(reason: string | undefined): LLMResponse['finishReason'] {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'tool-calls':
        return 'tool_calls';
      case 'content-filter':
        return 'content_filter';
      default:
        return null;
    }
  }
}

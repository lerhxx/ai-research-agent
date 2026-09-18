import {
  generateText,
  jsonSchema,
  streamText,
  tool,
  type JSONSchema7,
  type ModelMessage,
  type ToolSet,
} from 'ai';
import { deepseek } from '@ai-sdk/deepseek';

import type { LLMClient } from '../core/llm-client';
import {
  LLMOptions,
  LLMResponse,
  LLMStreamEvent,
  Message,
  ToolCall,
  ToolChoice,
} from '../core/types';

export interface DeepSeekClientOptions {
  apiKey?: string;
  model?: string;
}

export class DeepSeekClient {
  readonly model: string;

  constructor(options: DeepSeekClientOptions = {}) {
    this.model = options.model ?? process.env.DEEPSEEK_MODEL ?? 'deepseek-chat';

    if (!options.apiKey && !process.env.DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY is not configured')
    };
  }

  getConfig(messages: Message[], options: LLMOptions = {}) {
    const { tools, toolChoice, ...rest } = options;

    // AI SDK v7 不允许 messages 中包含 system 消息，需通过 instructions 选项传入
    const instructions = messages
      .filter((message) => message.role === 'system')
      .map((message) => message.content ?? '')
      .join('\n\n');

    const chatMessages = messages.filter(
      (message) => message.role !== 'system',
    );

    const config = {
      model: deepseek(this.model),
      tools,
      toolChoice: this.toToolChoice(toolChoice),
      ...rest,
    } as any;

    if (instructions) {
      config.instructions = instructions;
    }

    if (chatMessages.length) {
      config.messages = this.toModelMessage(chatMessages);
      delete config.prompt;
    }

    return config;
  }

  /** 非流式调用 */
  async chat( messages: Message[], options: LLMOptions = {} ): Promise<unknown> {
    const result = await generateText(this.getConfig(messages, options));

    // const toolCalls: ToolCall[] = result.toolCalls.map((toolCall) => ({
    //   id: toolCall.toolCallId,
    //   type: 'function',
    //   function: {
    //     name: toolCall.toolName,
    //     arguments: JSON.stringify(toolCall.input),
    //   }
    // }));

    // return {
    //   id: result.finalStep.response.id ?? result.finalStep.callId,
    //   model: this.model,
    //   content: result.text || null,
    //   toolCalls,
    //   finishReason: this.mapFinishReason( result.finishReason ),
    //   usage: result.usage ? {
    //     promptTokens: result.usage.inputTokens ?? 0,
    //     completionTokens: result.usage.outputTokens ?? 0,
    //     totalTokens: (result.usage.inputTokens ?? 0) + (result.usage.outputTokens ?? 0)
    //   } : undefined,
    // }
    return result;
  }

  /** 流式调用 */
  async *stream( messages: Message[], options: LLMOptions = {} ): AsyncGenerator<LLMStreamEvent> {
    const result = streamText(this.getConfig(messages, options))

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

  /** 将项目内部 ToolChoice 转换成 AI SDK v7 的 ToolChoice */
  private toToolChoice(
    choice?: ToolChoice,
  ): 'auto' | 'none' | 'required' | { type: 'tool'; toolName: string } | undefined {
    if (!choice) return undefined;
    if (typeof choice === 'string') return choice;
    return {
      type: 'tool',
      toolName: choice.function.name,
    };
  }

  /** 将项目内部 Message 转换成 AI SDK ModelMessage */
  private toModelMessage(messages: Message[]): ModelMessage[] {
    return messages.map((message) => {
      switch (message.role) {
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

/** LLM 消息角色 */
export type MessageRole =
  | 'system'
  | 'user'
  | 'assistant'
  | 'tool';

/** Tool Call LLM 决定调用某个 Tool 时产生。 */
export interface ToolCall {
  id: string;

  type: 'function';

  function: {
    name: string;

    /**
     * JSON 字符串
     *
     * 例如：
     * {"query":"北京旅游最佳季节"}
     */
    arguments: string;
  };
}

/** LLM 消息 */
export interface Message {
  role: MessageRole;

  content: string | null;

  toolCalls?: ToolCall[]; // Assistant 消息可能包含 Tool Calls

  toolCallId?: string; // Tool 消息对应的 Tool Call

  name?: string; // 可选名称
}

/** JSON Schema 类型 */
export type JSONSchema = Record<string, unknown>;

/**
 * LLM Tool
 *
 * 注意：
 * 这里描述的是“给模型看的 Tool 定义”，
 * 不是实际执行 Tool。
 *
 * 真正的 Tool Registry 后面再实现。
 */
export interface LLMTool {
  type: 'function';

  function: {
    name: string;

    description?: string;

    parameters?: JSONSchema;

    strict?: boolean;
  };
}

/** Tool Choice */
export type ToolChoice =
  | 'none'
  | 'auto'
  | 'required'
  | {
      type: 'function';
      function: {
        name: string;
      };
    };

/** LLM 请求参数 */
export interface LLMOptions {
  /** 最大输出 token */
  maxTokens?: number;

  /** 温度 */
  temperature?: number;

  /** Top P */
  topP?: number;

  /** 是否流式 */
  stream?: boolean;

  /** Tools */
  tools?: LLMTool[];

  /** Tool Choice */
  toolChoice?: ToolChoice;

  /** 是否开启 thinking 模式 */
  thinking?: {
    type: 'enabled' | 'disabled';
  };

  /** 推理强度 */
  reasoningEffort?: 'low' | 'high' | 'max';

  /** JSON Output */
  responseFormat?: {
    type: 'text' | 'json_object';
  };
}

/** Token 使用情况 */
export interface TokenUsage {
  promptTokens: number;

  completionTokens: number;

  totalTokens: number;
}

/** LLM 返回结果 */
export interface LLMResponse {
  /** 请求 ID */
  id: string;

  /** 模型 */
  model: string;

  /** 最终文本 */
  content: string | null;

  /** Tool Calls */
  toolCalls: ToolCall[];

  /** 结束原因 */
  finishReason:
    | 'stop'
    | 'length'
    | 'tool_calls'
    | 'content_filter'
    | 'insufficient_system_resource'
    | null;

  /** Token 使用量 */
  usage?: TokenUsage;

  /** 推理内容 */
  reasoningContent?: string | null;
}


/** Streaming Event */
export type LLMStreamEvent =
  | {
      type: 'text_delta';

      content: string;
    }
  | {
      type: 'reasoning_delta';

      content: string;
    }
  | {
      type: 'tool_call_delta';

      index: number;

      id?: string;

      name?: string;

      arguments?: string;
    }
  | {
      type: 'done';

      finishReason:
        | 'stop'
        | 'length'
        | 'tool_calls'
        | 'content_filter'
        | 'insufficient_system_resource'
        | null;
    };

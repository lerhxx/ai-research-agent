export interface ErrorInfo {
  name: string;
  message: string;
  stack?: string;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface Cost {
  input: number;
  output: number;
  total: number;
  currency: 'USD';
}

export interface TimeUseStatistics {
  timestamp: number;
  startedAt: number;
  endedAt?: number;
  durationMs?: number;
}

export interface AgentRunEvent  {
  readonly type: 'agent.run';

  runId: string;
  agentName: string;

  status: 'started' | 'completed' | 'failed';

  time: TimeUseStatistics;

  input?: {
    query?: string;
  };
  error?: ErrorInfo;
  result?: unknown;
}

export interface LLMCallEvent {
  readonly type: 'llm.call';
  runId: string;
  callId: string;

  provider: string;
  model: string;

  time: TimeUseStatistics;

  usage?: TokenUsage;
  status: 'success' | 'error';
  cost?: Cost;
  error?: ErrorInfo
}

export interface ToolCallEvent {
  readonly type: 'tool.call';

  runId: string;
  callId: string;

  toolName: string;
  toolCallId?: string;

  time: TimeUseStatistics;

  status: 'success' | 'error';

  input?: unknown;

  result?: {
    itemCount?: number;
    bytes?: number;
  };
  error?: ErrorInfo
}

export interface ErrorEvent {
  readonly type: 'error';

  runId?: string;

  timestamp: number;

  source: 'agent' | 'llm' | 'tool' | 'system';

  error: ErrorInfo;
}

export type TelemetryEvent =
  | AgentRunEvent
  | LLMCallEvent
  | ToolCallEvent
  | ErrorEvent;

export type TelemetryStatus = 'started' | 'success' | 'error' | 'completed' | 'failed';

export interface ModelPricing {
  provider: string;
  model: string;

  inputPerMillionTokens: number;
  outputPerMillionTokens: number;

  currency: 'USD';
}

export interface ToolUsageSummary {
  calls: number;
  success: number;
  failed: number;
  totalDurationMs: number;
}

export interface RunSummary {
  runId: string;
  
  durationMs: number;

  llm: {
    calls: number;
    cost: number;
  } & TokenUsage;
  
  tools: {
    totalCalls: number;
    byTool: Record<string, ToolUsageSummary>;
  };

  totalCost: number;
}

export interface RunContext {
  runId: string;
  agentName: string;
  startedAt: number;
  metadata?: Record<string, unknown>;
}

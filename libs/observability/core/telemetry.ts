import { randomUUID } from 'node:crypto';

import { 
  AgentRunEvent,
  ErrorEvent,
  LLMCallEvent,
  RunSummary,
  TelemetryEvent,
  TokenUsage,
  ToolCallEvent,
  ModelPricing,
  ErrorInfo,
 } from './types';

import { calculateLLMCost } from './cost-calculator';
import { createRunContext, RunContext } from './run-context';

export interface TelemetrySink {
  track(event: TelemetryEvent): void;
}

export function normalizeError(error: unknown): ErrorInfo {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    name: 'UnknownError',
    message: String(error),
  }
}

export class Telemetry {
  private readonly events: TelemetryEvent[] = [];

  constructor(
    private readonly sink: TelemetrySink,
    private readonly pricing: Record<string, ModelPricing> = {}
  ) {}

  private emit(event: TelemetryEvent): void {
    this.events.push(event);
    this.sink.track(event);
  }

  startRun(options: {
    agentName: string;
    query?: string;
    metadata?: Record<string, unknown>;
  }): RunContext {
    const context = createRunContext(options.agentName, options.metadata);

    const event: AgentRunEvent = {
      type: 'agent.run',
      runId: context.runId,
      agentName: context.agentName,
      status: 'started',
      time: {
        timestamp: Date.now(),
        startedAt: context.startedAt,
      },
      input: {
        query: options.query,
      },
    };
    this.emit(event);
    
    return context;
  }

  completeRun(context: RunContext, result: unknown): void {
    const endedAt = Date.now();

    const event: AgentRunEvent = {
      type: 'agent.run',
      runId: context.runId,
      agentName: context.agentName,
      status: 'completed',
      time: {
        timestamp: endedAt,
        startedAt: context.startedAt,
        endedAt,
        durationMs: endedAt - context.startedAt,
      },
      result,
    }
    this.emit(event);
  }

  failRun(context: RunContext, error: unknown): void {
    const endedAt = Date.now();

    const event: AgentRunEvent = {
      type: 'agent.run',
      runId: context.runId,
      agentName: context.agentName,
      status: 'failed',
      time: {
        timestamp: endedAt,
        startedAt: context.startedAt,
        endedAt,
        durationMs: endedAt - context.startedAt,
      },
      error: normalizeError(error),
    }
    this.emit(event);
  }

  trackLLMCall(options: {
    context: RunContext;
    provider: string;
    model: string;
    startedAt: number;
    endedAt?: number;
    usage?: TokenUsage;
    status?: 'success' | 'error';
    error?: unknown;
  }): string {
    const callId = `llm_${randomUUID()}`;
    const endedAt = options.endedAt ?? Date.now();
    const durationMs = endedAt - options.startedAt;
    const status = options.status ?? 'success';
    const event: LLMCallEvent = {
      type: 'llm.call',
      runId: options.context.runId,
      callId,
      provider: options.provider,
      model: options.model,
      status,
      time: {
        timestamp: endedAt,
        startedAt: options.startedAt,
        endedAt,
        durationMs,
      },
      usage: options.usage
    }

    if (options.usage) {
      const pricingKey = `${options.provider}:${options.model}`;
      const pricing = this.pricing[pricingKey];

      if (pricing) {
        event.cost = calculateLLMCost(pricing, options.usage);
      }
    }

    if (options.error) {
      event.error = normalizeError(options.error);
    }

    this.emit(event);

    return callId;
  }

  trackToolCall(options: {
    context: RunContext;

    toolName: string;
    toolCallId?: string;

    startedAt: number;
    endedAt?: number;

    input?: unknown;

    result?: {
      itemCount?: number;
      bytes?: number;
    };

    status?: 'success' | 'error';

    error?: unknown;
  }): string {
    const callId = `tool_${randomUUID()}`;
    const endedAt = options.endedAt ?? Date.now();

    const event: ToolCallEvent = {
      type: 'tool.call',
      runId: options.context.runId,
      callId,
      toolName: options.toolName,
      toolCallId: options.toolCallId,
      status: options.status ?? 'success',
      time: {
        timestamp: endedAt,
        startedAt: options.startedAt,
        endedAt,
        durationMs: endedAt - options.startedAt,
      },
      input: options.input,
      result: options.result,
    };

    if (options.error) {
      event.error = normalizeError(options.error);
    }

    this.emit(event);

    return callId;

  }

  trackError(options: {
    runId?: string;

    source:
      | 'agent'
      | 'llm'
      | 'tool'
      | 'system';

    error: unknown;
  }): void {
    const event: ErrorEvent = {
      type: 'error',
      runId: options.runId,
      timestamp: Date.now(),
      source: options.source,
      error: normalizeError(options.error),
    };

    this.emit(event);
  }

  getEvents(runId?: string): TelemetryEvent[] {
    if (!runId) {
      return [...this.events];
    }

    return this.events.filter((event) => event.runId === runId);
  }

  getRunSummary(runId: string): RunSummary {
    const events = this.getEvents();
    
    const agentEvents = events.filter((event): event is AgentRunEvent => event.type === 'agent.run');
    const started = agentEvents.find((event) => event.status = 'started');
    const completed = agentEvents.find((event) => ['completed', 'failed'].includes(event.status));
    const durationMs = completed?.time.durationMs ?? (started ? Date.now() - started.time.startedAt : 0);
    
    const llmEvents = events.filter((event): event is LLMCallEvent => event.type === 'llm.call');
    const llmEventsSummary = this.getLLMEventsSummary(llmEvents);
    
    const toolEvents = events.filter((event): event is ToolCallEvent => event.type === 'tool.call');
    const toolEventsSummary = this.getToolEventsSummary(toolEvents);

    return {
      runId,
      durationMs,
      llm: llmEventsSummary,
      totalCost: llmEventsSummary.cost,
      tools: toolEventsSummary,
    };
  }

  getLLMEventsSummary(llmEvents: LLMCallEvent[]) {
    let inputTokens = 0;
    let outputTokens = 0;
    let totalTokens = 0;
    let llmCost = 0;
    for (const event of llmEvents) {
      if (event.usage) {
        inputTokens += event.usage.inputTokens;
        outputTokens += event.usage.outputTokens;
        totalTokens += event.usage.totalTokens;
      }

      if (event.cost) {
        llmCost += event.cost.total;
      }
    }

    return {
      calls: llmEvents.length,
      inputTokens,
      outputTokens,
      totalTokens,
      cost: llmCost,
    }
  }

  getToolEventsSummary(toolEvents: ToolCallEvent[]) {
    const byTool: RunSummary['tools']['byTool'] = {};

    for (const event of toolEvents) {
      if (!byTool[event.toolName]) {
        byTool[event.toolName] = {
          calls: 0,
          success: 0,
          failed: 0,
          totalDurationMs: 0,
        };
      }

      const summary = byTool[event.toolName];
      summary.calls += 1;

      if (event.status === 'success') {
        summary.success += 1;
      }

      if (event.status === 'error') {
        summary.failed += 1;
      }

      summary.totalDurationMs += event.time.durationMs ?? 0;
    }

    return {
      totalCalls: toolEvents.length,
      byTool,
    }
  }
}

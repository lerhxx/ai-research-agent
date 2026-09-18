import { randomUUID } from "node:crypto";

export interface RunContext {
  runId: string;
  agentName: string;
  startedAt: number;
  metadata?: Record<string, unknown>;
}

export function createRunContext(
  agentName: string,
  metadata?: Record<string, unknown>
): RunContext {
  return {
    runId: `run_${randomUUID()}`,
    agentName,
    startedAt: Date.now(),
    metadata,
  }
}
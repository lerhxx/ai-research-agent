import { z } from 'zod';
import type { RunContext } from '../../observability';

export interface Tool<
  TInput extends z.ZodType = z.ZodType,
  TResult = unknown,
> {
  name: string;
  description: string;
  inputSchema: TInput;
  execute(
    options: unknown,
    context: { run: RunContext },
  ): Promise<TResult>;
}

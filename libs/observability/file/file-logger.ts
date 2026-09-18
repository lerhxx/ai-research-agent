// libs/observability/file/file-logger.ts

import {
  appendFileSync,
  existsSync,
  mkdirSync,
} from 'node:fs';
import { join } from 'node:path';
import { Logger } from '../core/logger';

function formatFileTimestamp( date: Date ): string {
  return date
    .toISOString()
    .replace(/\.\d{3}Z$/, '')
    .replace(/:/g, '-');
}

export class FileLogger implements Logger {
  private readonly logsDir: string;
  private readonly logFile: string;

  constructor(logsDir = join(process.cwd(), 'logs')) {
    this.logsDir = logsDir;

    /** 判断 logs/ 是否存在 */
    if (!existsSync(this.logsDir)) {
      mkdirSync(this.logsDir, { recursive: true });
    }

    const timestamp = formatFileTimestamp(new Date());
    this.logFile = join(this.logsDir, `${timestamp}.log`);
  }

  private write(level: string, message: string, meta: Record<string, unknown>): void {
    const log = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta
    };

    appendFileSync(this.logFile, `${JSON.stringify(log)}\n`, { encoding: 'utf8' });
  }

  debug(
    message: string,
    meta: Record<string, unknown> = {},
  ): void {
    this.write(
      'debug',
      message,
      meta,
    );
  }

  info(
    message: string,
    meta: Record<string, unknown> = {},
  ): void {
    this.write(
      'info',
      message,
      meta,
    );
  }

  warn(
    message: string,
    meta: Record<string, unknown> = {},
  ): void {
    this.write(
      'warn',
      message,
      meta,
    );
  }

  error(
    message: string,
    meta: Record<string, unknown> = {},
  ): void {
    this.write(
      'error',
      message,
      meta,
    );
  }
}

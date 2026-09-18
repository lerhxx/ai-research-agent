import { Logger } from '../core/logger';

export class ConsoleLogger implements Logger {
  debug(message: string, meta: Record<string, unknown> = {}): void {
    this.write('debug', message, meta);
  }

  info(message: string, meta = {}): void {
    this.write('info', message, meta);
  }

  warn(message: string, meta = {}): void {
    this.write('warn', message, meta);
  }

  error(message: string, meta = {}): void {
    this.write('error', message, meta);
  }

  private write(level: string, message: string, meta: Record<string, unknown>): void {
    const log = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
    };

    if (level === 'error') {
      console.error(JSON.stringify(log));
      return;
    }

    console.log(JSON.stringify(log));
  }
}
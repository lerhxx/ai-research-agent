import { Telemetry } from './core/telemetry';
import { ConsoleLogger } from './console/console-logger';
import { FileLogger } from './file/file-logger';
import { TelemetrySink } from './core/telemetry';
import { Logger } from './core/logger';
import { TelemetryEvent } from './core/types';
import { sanitize } from './core/sanitizer';
import { MODEL_PRICING } from './core/pricing';
import * as dotenv from 'dotenv';

dotenv.config();

export class LoggerTelemetry implements TelemetrySink {
  constructor(private readonly logger: Logger) {}

  track(event: TelemetryEvent) {
    this.logger.info(event.type, sanitize(event) as unknown as Record<string, unknown>);
  }
}

const logger = process.env.STORE_LOG ? new FileLogger() : new ConsoleLogger();
const sink = new LoggerTelemetry(logger);
export const telemetry = new Telemetry(sink, MODEL_PRICING);
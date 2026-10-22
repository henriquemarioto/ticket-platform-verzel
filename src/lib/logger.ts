type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  meta?: Record<string, unknown>;
  error?: {
    name?: string;
    message: string;
    stack?: string;
    code?: unknown;
  };
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class StructuredLogger {
  private defaultMeta: Record<string, unknown>;

  constructor(defaultMeta: Record<string, unknown> = {}) {
    this.defaultMeta = defaultMeta;
  }

  private shouldLog(level: LogLevel): boolean {
    const isTest = process.env.NODE_ENV === "test";
    const configuredLevel = (process.env.LOG_LEVEL?.toLowerCase() as LogLevel) || (isTest ? "error" : "info");
    
    // Em testes, suprime logs a menos que configurado explicitamente
    if (isTest && process.env.LOG_LEVEL !== "debug" && process.env.LOG_LEVEL !== "info") {
      return false;
    }

    return LEVEL_PRIORITY[level] >= (LEVEL_PRIORITY[configuredLevel] ?? LEVEL_PRIORITY.info);
  }

  private formatError(error: unknown) {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as { code?: unknown }).code,
      };
    }
    if (error && typeof error === "object") {
      return { message: JSON.stringify(error) };
    }
    return error ? { message: String(error) } : undefined;
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>, error?: unknown): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(this.defaultMeta.context ? { context: String(this.defaultMeta.context) } : {}),
      meta: { ...this.defaultMeta, ...meta },
      ...(error ? { error: this.formatError(error) } : {}),
    };

    if (process.env.NODE_ENV === "production") {
      // JSON de linha única em produção para ingestão limpa
      const output = JSON.stringify(entry);
      if (level === "error") {
        console.error(output);
      } else if (level === "warn") {
        console.warn(output);
      } else {
        console.log(output);
      }
    } else {
      // Formato legível para desenvolvimento
      const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]${entry.context ? ` [${entry.context}]` : ""}`;
      const payload = entry.meta && Object.keys(entry.meta).length > 0 ? entry.meta : "";
      if (level === "error") {
        console.error(prefix, message, payload, entry.error || "");
      } else if (level === "warn") {
        console.warn(prefix, message, payload);
      } else {
        console.log(prefix, message, payload);
      }
    }
  }

  public debug(message: string, meta?: Record<string, unknown>): void {
    this.log("debug", message, meta);
  }

  public info(message: string, meta?: Record<string, unknown>): void {
    this.log("info", message, meta);
  }

  public warn(message: string, meta?: Record<string, unknown>): void {
    this.log("warn", message, meta);
  }

  public error(message: string, error?: unknown, meta?: Record<string, unknown>): void {
    this.log("error", message, meta, error);
  }

  public child(defaultMeta: Record<string, unknown>): StructuredLogger {
    return new StructuredLogger({ ...this.defaultMeta, ...defaultMeta });
  }
}

export const logger = new StructuredLogger();

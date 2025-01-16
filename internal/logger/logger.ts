import { ILogger } from "./logger.interface";

class Logger implements ILogger {
  private static instance: Logger;

  // Private constructor to prevent direct instantiation
  private constructor() {}

  // Method to retrieve the singleton instance
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  // Helper method to log messages
  private logToConsole(level: string, message: string): void {
    const timestamp = new Date().toISOString();

    const consoleMethods: Record<string, (message: string) => void> = {
      log: console.log,
      warn: console.warn,
      error: console.error,
    };

    const logMethod = consoleMethods[level];
    if (logMethod) {
      logMethod(`[${timestamp}] ${message}`);
    } else {
      console.error(`[${timestamp}] Invalid log level: ${level}`);
    }
  }

  // ILogger methods
  info(message: string): void {
    this.logToConsole("log", `INFO: ${message}`);
  }

  warn(message: string): void {
    this.logToConsole("warn", `WARN: ${message}`);
  }

  error(message: string): void {
    this.logToConsole("error", `ERROR: ${message}`);
  }

  debug(message: string): void {
    this.logToConsole("log", `DEBUG: ${message}`);
  }

  fatal(message: string): void {
    this.logToConsole("error", `FATAL: ${message}`);
    process.exit(1); // Exit the process in case of fatal errors
  }
}

export default Logger;

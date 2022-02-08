export class LogApi {
  constructor(private contextName: string) {}

  createContext(contextName: string): LogApi {
    return new LogApi(contextName);
  }

  debug(message: string, messageContext?: Record<string, any>): void {
    console.log(`[DEBUG - ${new Date()}] [${this.contextName}]: ${message}`, messageContext);
  }

  info(message: string, messageContext?: Record<string, any>): void {
    console.info(`[INFO - ${new Date()}] [${this.contextName}]: ${message}`, messageContext);
  }

  warn(message: string, messageContext?: Record<string, any>): void {
    console.warn(`[WARN - ${new Date()}] [${this.contextName}]: ${message}`, messageContext);
  }

  error(message: string, messageContext?: Record<string, any>): void {
    console.error(`[ERROR - ${new Date()}] [${this.contextName}]: ${message}`, messageContext);
  }
}

export class Logger {
    static debug(message: string, messageContext?: Record<string, any>): void {
        console.log(message);
      }
    
      static info(message: string, messageContext?: Record<string, any>): void {
        console.info(message);
      }
    
      static warn(message: string, messageContext?: Record<string, any>): void {
        console.warn(message);
      }
    
      static error(message: string, messageContext?: Record<string, any>): void {
        console.error(message);
      }
}
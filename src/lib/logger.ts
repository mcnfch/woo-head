import fs from 'fs';
import path from 'path';

class Logger {
  private static instance: Logger;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatError(error: any): string {
    const timestamp = new Date().toISOString();
    const errorMessage = error.message || 'Unknown error';
    const errorStack = error.stack || '';
    const errorResponse = error.response?.data ? JSON.stringify(error.response.data, null, 2) : '';
    
    return `
[${timestamp}] ERROR
Message: ${errorMessage}
Stack: ${errorStack}
Response: ${errorResponse}
----------------------------------------
`;
  }

  public error(context: string, error: any) {
    const errorLog = this.formatError(error);
    const logMessage = `[${context}] ${errorLog}`;
    
    // In development, always log to console
    if (process.env.NODE_ENV !== 'production') {
      console.error(logMessage);
    }

    // In production, only log critical errors
    if (process.env.NODE_ENV === 'production') {
      // You could implement production logging here
      // For example, sending to a logging service
    }
  }
}

export const logger = Logger.getInstance();

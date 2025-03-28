import { Request } from 'express';
import { RequestData } from '@shared/schema';

export class RequestInspector {
  /**
   * Extract relevant data from an Express request object
   */
  static extractRequestData(req: Request): RequestData {
    const ipAddress = req.ip || req.socket.remoteAddress || '0.0.0.0';
    
    // Handle the path, removing query parameters
    const path = req.originalUrl || req.url;
    
    return {
      ipAddress,
      method: req.method,
      path,
      headers: req.headers as Record<string, string>,
      payload: req.body
    };
  }
  
  /**
   * Sanitize request data to remove sensitive information
   * This could be expanded to redact specific fields like passwords, tokens, etc.
   */
  static sanitizeRequestData(requestData: RequestData): RequestData {
    // Create a deep copy to avoid modifying the original
    const sanitized = JSON.parse(JSON.stringify(requestData));
    
    // Sanitize sensitive headers
    if (sanitized.headers) {
      // Remove or mask auth headers
      if (sanitized.headers.authorization) {
        sanitized.headers.authorization = '[REDACTED]';
      }
      
      if (sanitized.headers.cookie) {
        sanitized.headers.cookie = '[REDACTED]';
      }
    }
    
    // Sanitize sensitive payload fields
    if (sanitized.payload && typeof sanitized.payload === 'object') {
      const sensitiveFields = ['password', 'token', 'secret', 'key', 'credential'];
      
      for (const field of sensitiveFields) {
        this.redactObjectField(sanitized.payload, field);
      }
    }
    
    return sanitized;
  }
  
  /**
   * Recursively redact fields in an object that match a given key
   */
  private static redactObjectField(obj: any, fieldToRedact: string): void {
    if (!obj || typeof obj !== 'object') return;
    
    for (const key in obj) {
      if (key.toLowerCase().includes(fieldToRedact.toLowerCase()) && typeof obj[key] === 'string') {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        this.redactObjectField(obj[key], fieldToRedact);
      }
    }
  }
}

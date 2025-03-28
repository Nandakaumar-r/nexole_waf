
import { Request } from 'express';
import { storage } from '../storage';

export class RateLimiter {
  private static requests = new Map<string, number[]>();
  
  static async checkLimit(req: Request, windowMs: number = 60000, max: number = 100): Promise<boolean> {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    let requests = this.requests.get(key) || [];
    requests = requests.filter(time => time > windowStart);
    requests.push(now);
    
    this.requests.set(key, requests);
    return requests.length <= max;
  }
}

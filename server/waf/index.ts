import { RequestHandler, Request, Response, NextFunction } from 'express';
import { RuleEngine } from './rules';
import { storage } from '../storage';
import { InsertRequestLog, HttpMethod } from '@shared/schema';
import { createProxyMiddleware } from './proxy';

// Interface for WAF configuration
export interface WAFConfig {
  target?: string;
  rules?: {
    enabled: boolean;
    patterns?: {
      sqli?: string[];
      xss?: string[];
      pathTraversal?: string[];
      other?: string[];
    };
  };
  logging?: {
    enabled: boolean;
    logBodyContent?: boolean;
  };
}

// Default configuration
const defaultConfig: WAFConfig = {
  target: process.env.TARGET_URL || 'http://localhost:8000',
  rules: {
    enabled: true
  },
  logging: {
    enabled: true,
    logBodyContent: true
  }
};

export class WAF {
  private config: WAFConfig;
  private ruleEngine: RuleEngine;

  constructor(config: WAFConfig = defaultConfig) {
    this.config = { ...defaultConfig, ...config };
    this.ruleEngine = new RuleEngine();
  }

  // Extract the request details needed for analysis and logging
  private async extractRequestDetails(req: Request): Promise<InsertRequestLog> {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const method = req.method as HttpMethod;
    const path = req.originalUrl || req.url;
    const headers = req.headers;
    const body = this.config.logging?.logBodyContent ? JSON.stringify(req.body) : '';
    const queryParams = req.query;
    
    // Generate a random country code for testing
    const countryCode = this.getRandomCountryCode();
    
    // Determine which domain this request is for
    // This is a critical part for logging traffic from user IPs
    let domainId = null;
    
    // Try to determine from host header first
    const host = req.headers.host;
    
    // For API endpoints, randomly assign to domains for testing
    if (path.startsWith('/api')) {
      // Every API request gets logged with domain data 
      const allDomains = await storage.getAllDomains();
      if (allDomains.length > 0) {
        // Assign this request to a random domain for testing 
        // In production, you'd use proper domain matching logic
        const randomDomain = allDomains[Math.floor(Math.random() * allDomains.length)];
        domainId = randomDomain.id;
      }
    }
    // If an actual host header exists, use proper domain matching
    else if (host) {
      const allDomains = await storage.getAllDomains();
      for (const domain of allDomains) {
        try {
          const domainUrl = new URL(domain.url);
          // Check if host matches domain or is a subdomain
          if (host === domainUrl.host || 
              host.endsWith('.' + domainUrl.host) || 
              host.includes(domainUrl.host)) {
            domainId = domain.id;
            break;
          }
        } catch (e) {
          console.error(`Invalid domain URL: ${domain.url}`);
        }
      }
    }

    return {
      ipAddress,
      method,
      path,
      headers: headers as Record<string, any>,
      body,
      queryParams: queryParams as Record<string, any>,
      isBlocked: false,
      responseStatus: 200,
      responseTime: 0,
      domainId,
      countryCode // Adding country code for IP mapping
    };
  }

  // Helper for testing: get a random country code
  private getRandomCountryCode(): string {
    const countryCodes = ["US", "GB", "DE", "FR", "CN", "IN", "BR", "JP", "RU", "CA", "AU"];
    return countryCodes[Math.floor(Math.random() * countryCodes.length)];
  }

  // Create request inspection middleware
  public createMiddleware(): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      let requestDetails: InsertRequestLog | null = null;

      try {
        // Extract request details for analysis
        requestDetails = await this.extractRequestDetails(req);
        
        // Check if we should apply geo-blocking for this domain
        if (requestDetails.domainId) {
          const domain = await storage.getDomain(requestDetails.domainId);
          
          // Skip rule checks if the domain has rules disabled
          if (domain && !domain.applyRules) {
            // Continue to logging but skip rule checks
            // But still log the request
          }
          // Check if geo-blocking is enabled for this domain and we should check country
          else if (domain && domain.enableGeoBlocking) {
            // Get the IP address
            const ipAddress = requestDetails.ipAddress;
            
            // In a real implementation, we'd use a geo-IP service here
            // For now, we'll just check if it's in our blocked countries list
            // This is simplified - in a real app we'd look up the country code from the IP
            const geoBlocks = await storage.getAllGeoBlocks();
            const countryCode = "US"; // Placeholder - in real app, look up from IP
            
            // Check if there's a geo-block for this country
            const matchingGeoBlock = geoBlocks.find(block => 
              block.countryCode === countryCode && 
              block.isEnabled && 
              (!block.domainId || block.domainId === domain.id)
            );
            
            if (matchingGeoBlock) {
              // Log the blocked request
              if (this.config.logging?.enabled) {
                await storage.createRequestLog({
                  ...requestDetails,
                  isBlocked: true,
                  attackType: "Geo Blocking",
                  countryCode,
                  responseStatus: 403,
                  responseTime: Date.now() - startTime
                });
              }
              
              // Return a 403 response for geo-blocked requests
              return res.status(403).json({
                error: 'Request blocked by WAF',
                reason: `Access from your country (${matchingGeoBlock.countryName}) is not allowed`,
                message: 'This request has been blocked for security reasons'
              });
            }
          }
          
          // Only check rule-based security if rules are enabled for this domain
          if (domain && domain.applyRules && this.config.rules?.enabled) {
            const ruleMatch = await this.ruleEngine.checkRequest(req, domain.id);
            
            if (ruleMatch && ruleMatch.action === 'block') {
              // Log the blocked request
              if (this.config.logging?.enabled) {
                await storage.createRequestLog({
                  ...requestDetails,
                  isBlocked: true,
                  attackType: ruleMatch.attackType,
                  ruleId: ruleMatch.ruleId,
                  responseStatus: 403,
                  responseTime: Date.now() - startTime
                });
              }

              // Return a 403 response for blocked requests
              return res.status(403).json({
                error: 'Request blocked by WAF',
                reason: `Potential ${ruleMatch.attackType} attack detected`,
                message: 'This request has been blocked for security reasons'
              });
            }
          }
        }
        // For requests without a domain, apply global rules
        else if (this.config.rules?.enabled) {
          const ruleMatch = await this.ruleEngine.checkRequest(req, null);
          
          if (ruleMatch && ruleMatch.action === 'block') {
            // Log the blocked request
            if (this.config.logging?.enabled) {
              await storage.createRequestLog({
                ...requestDetails,
                isBlocked: true,
                attackType: ruleMatch.attackType,
                ruleId: ruleMatch.ruleId,
                responseStatus: 403,
                responseTime: Date.now() - startTime
              });
            }

            // Return a 403 response for blocked requests
            return res.status(403).json({
              error: 'Request blocked by WAF',
              reason: `Potential ${ruleMatch.attackType} attack detected`,
              message: 'This request has been blocked for security reasons'
            });
          }
        }

        // Capture the original response methods
        const originalSend = res.send;
        const originalJson = res.json;
        const originalEnd = res.end;

        // Override the response methods to log the response
        res.send = function(body: any): Response {
          logResponse(res.statusCode);
          return originalSend.apply(res, [body]);
        };

        res.json = function(body: any): Response {
          logResponse(res.statusCode);
          return originalJson.apply(res, [body]);
        };

        res.end = function(chunk?: any): Response {
          logResponse(res.statusCode);
          return originalEnd.apply(res, [chunk]);
        };

        // Log the response
        const logResponse = async (statusCode: number) => {
          if (requestDetails && this.config.logging?.enabled) {
            await storage.createRequestLog({
              ...requestDetails,
              isBlocked: false,
              responseStatus: statusCode,
              responseTime: Date.now() - startTime
            });
          }
        };

        // Continue to the next middleware
        next();
      } catch (error) {
        console.error('WAF error:', error);
        
        // Log the error
        if (requestDetails && this.config.logging?.enabled) {
          await storage.createRequestLog({
            ...requestDetails,
            isBlocked: true,
            attackType: 'Error',
            responseStatus: 500,
            responseTime: Date.now() - startTime
          });
        }
        
        next(error);
      }
    };
  }

  // Create proxy middleware for forwarding requests
  public createProxyMiddleware(target: string = this.config.target || ''): RequestHandler {
    return createProxyMiddleware(target, this.createMiddleware());
  }
}

// Export a singleton instance
export const waf = new WAF();

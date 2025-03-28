import { Request, Response, NextFunction } from 'express';
import { RequestInspector } from './requestInspector';
import { RuleEngine } from './ruleEngine';
import { storage } from '../storage';
import { RequestData } from '@shared/schema';

/**
 * Web Application Firewall middleware
 * Inspects incoming requests and blocks malicious ones
 */
export async function wafMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Skip WAF for API requests to avoid circular protection
    if (req.path.startsWith('/api/waf') || req.path.startsWith('/api/admin')) {
      return next();
    }
    
    // Get WAF configuration
    const wafConfig = await storage.getWafConfig();
    
    // Skip if the WAF is disabled
    if (wafConfig && !wafConfig.isActive) {
      return next();
    }
    
    // Start performance measurement
    const startTime = process.hrtime();
    
    // Extract request data
    const requestData = RequestInspector.extractRequestData(req);
    
    // Check if the attacker's IP is already blocked
    const attacker = await storage.getAttackerByIp(requestData.ipAddress);
    if (attacker && attacker.blocked) {
      return res.status(403).json({
        blocked: true,
        message: 'Access denied: Your IP address has been blocked due to suspicious activity',
        code: 'IP_BLOCKED'
      });
    }
    
    // Get all rules from storage
    const rules = await storage.getRules();
    
    // Evaluate the request against the rules
    const ruleMatch = RuleEngine.evaluateRequest(requestData, rules);
    
    // Measure response time
    const hrTime = process.hrtime(startTime);
    const responseTimeMs = Math.round(hrTime[0] * 1000 + hrTime[1] / 1000000);
    
    // Update WAF configuration with current response time (smoothed average)
    if (wafConfig) {
      const currentTime = wafConfig.responseTime;
      const newTime = Math.round(currentTime * 0.7 + responseTimeMs * 0.3); // Weighted average
      await storage.updateWafConfig({ responseTime: newTime });
    }
    
    if (ruleMatch) {
      // Sanitize the request data to remove sensitive information
      const sanitizedRequestData = RequestInspector.sanitizeRequestData(requestData);
      
      // Log the blocked request
      await storage.createBlockedRequest({
        ipAddress: sanitizedRequestData.ipAddress,
        method: sanitizedRequestData.method,
        path: sanitizedRequestData.path,
        attackType: ruleMatch.rule.attackType,
        ruleId: ruleMatch.rule.ruleIdentifier,
        headers: sanitizedRequestData.headers,
        payload: sanitizedRequestData.payload,
        matchedPattern: ruleMatch.matchedPattern
      });
      
      // Increment total request count
      if (wafConfig) {
        await storage.updateStatistics(ruleMatch.rule.attackType);
      }
      
      // Return a 403 Forbidden response
      return res.status(403).json({
        blocked: true,
        message: 'Request blocked by Web Application Firewall',
        rule: ruleMatch.rule.ruleIdentifier,
        attackType: ruleMatch.rule.attackType
      });
    }
    
    // If everything is OK, continue to the next middleware
    next();
  } catch (error) {
    console.error('WAF Error:', error);
    // Even if WAF fails, let the request continue to avoid breaking the application
    next();
  }
}

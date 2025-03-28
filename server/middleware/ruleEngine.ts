import { Rule, RequestData } from "@shared/schema";

export interface RuleMatch {
  rule: Rule;
  matchedPattern: string;
}

export class RuleEngine {
  /**
   * Evaluates a request against all rules
   * @param request The request to evaluate
   * @param rules The rules to evaluate against
   * @returns The first rule that matches or undefined if no match
   */
  static evaluateRequest(request: RequestData, rules: Rule[]): RuleMatch | undefined {
    // Only evaluate enabled rules
    const enabledRules = rules.filter(rule => rule.enabled);
    
    // Function to check if any part of the request matches a pattern
    const matchesPattern = (content: string, pattern: string): string | null => {
      try {
        const regex = new RegExp(pattern, 'i');
        const match = content.match(regex);
        return match ? match[0] : null;
      } catch (error) {
        console.error(`Invalid regex pattern in rule: ${pattern}`, error);
        return null;
      }
    };
    
    // Check request path
    for (const rule of enabledRules) {
      const pathMatch = matchesPattern(request.path, rule.pattern);
      if (pathMatch) {
        return { rule, matchedPattern: pathMatch };
      }
    }
    
    // Check request headers (as string)
    const headersStr = JSON.stringify(request.headers);
    for (const rule of enabledRules) {
      const headerMatch = matchesPattern(headersStr, rule.pattern);
      if (headerMatch) {
        return { rule, matchedPattern: headerMatch };
      }
    }
    
    // Check request payload if it exists
    if (request.payload) {
      const payloadStr = typeof request.payload === 'string' 
        ? request.payload 
        : JSON.stringify(request.payload);
      
      for (const rule of enabledRules) {
        const payloadMatch = matchesPattern(payloadStr, rule.pattern);
        if (payloadMatch) {
          return { rule, matchedPattern: payloadMatch };
        }
      }
    }
    
    // No rule matched
    return undefined;
  }
}

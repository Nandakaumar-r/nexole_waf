import { Request } from 'express';
import { storage } from '../storage';
import { Rule, AttackType, RuleAction } from '@shared/schema';

// Interface for rule match results
export interface RuleMatch {
  ruleId: number;
  name: string;
  attackType: AttackType;
  pattern: string;
  action: RuleAction;
  matchLocation: string;
  matchedValue: string;
}

export class RuleEngine {
  // Check if a request matches any of the rules
  async checkRequest(req: Request, domainId?: number | null): Promise<RuleMatch | null> {
    try {
      // Get all enabled rules
      const rules = await storage.getAllRules();
      
      // First check domain-specific rules if a domainId is provided
      if (domainId) {
        const domainRules = rules.filter(rule => 
          rule.isEnabled && 
          rule.domainId === domainId
        );
        
        // Check domain-specific rules first
        for (const rule of domainRules) {
          const match = await this.matchRule(rule, req);
          if (match) {
            return {
              ruleId: rule.id,
              name: rule.name,
              attackType: rule.attackType as AttackType,
              pattern: rule.pattern,
              action: rule.action as RuleAction,
              matchLocation: match.location,
              matchedValue: match.value
            };
          }
        }
      }
      
      // Then check global rules
      const globalRules = rules.filter(rule => 
        rule.isEnabled && 
        rule.isGlobal
      );
      
      for (const rule of globalRules) {
        const match = await this.matchRule(rule, req);
        if (match) {
          return {
            ruleId: rule.id,
            name: rule.name,
            attackType: rule.attackType as AttackType,
            pattern: rule.pattern,
            action: rule.action as RuleAction,
            matchLocation: match.location,
            matchedValue: match.value
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error checking rules:', error);
      return null;
    }
  }
  
  // Check if a request matches a specific rule
  private async matchRule(rule: Rule, req: Request): Promise<{location: string, value: string} | null> {
    const patternRegex = new RegExp(rule.pattern, 'i');
    const locations = rule.matchLocation.split(',').map(loc => loc.trim());
    
    // Check pattern against each location
    for (const location of locations) {
      let valueToCheck: any;
      
      switch (location) {
        case 'path':
          valueToCheck = req.path;
          break;
        case 'query':
          valueToCheck = JSON.stringify(req.query);
          break;
        case 'body':
          valueToCheck = JSON.stringify(req.body);
          break;
        case 'headers':
          valueToCheck = JSON.stringify(req.headers);
          break;
        case 'cookies':
          valueToCheck = JSON.stringify(req.cookies);
          break;
        default:
          continue;
      }
      
      // If we have a value to check, test it against the pattern
      if (valueToCheck && patternRegex.test(valueToCheck)) {
        return {
          location,
          value: valueToCheck.toString()
        };
      }
    }
    
    return null;
  }
  
  // Helper method to test a value against a pattern
  testPattern(pattern: string, value: string): boolean {
    try {
      const regex = new RegExp(pattern, 'i');
      return regex.test(value);
    } catch (error) {
      console.error('Invalid regex pattern:', pattern, error);
      return false;
    }
  }
}

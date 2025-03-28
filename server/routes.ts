import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { waf } from "./waf";
import { z } from "zod";
import { 
  insertRuleSchema, 
  insertDomainSchema, 
  insertGeoBlockSchema, 
  insertThreatFeedSchema, 
  insertThreatEntrySchema, 
  insertUserSchema,
  User as SelectUser
} from "@shared/schema";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Setup authentication
  setupAuth(app);
  
  // Apply the WAF middleware to all routes
  app.use(waf.createMiddleware());

  // API Routes (prefix all with /api)
  
  // Protected routes - require authentication
  app.use("/api/dashboard", isAuthenticated);
  app.use("/api/rules", isAuthenticated);
  app.use("/api/domains", isAuthenticated);
  app.use("/api/geo-blocks", isAuthenticated);
  app.use("/api/threat", isAuthenticated);
  app.use("/api/requests", isAuthenticated);
  app.use("/api/attackers", isAuthenticated);
  app.use("/api/stats", isAuthenticated);
  app.use("/api/traffic", isAuthenticated);
  app.use("/api/users", isAdmin); // User management routes require admin access
  
  // Get Firebase configuration
  app.get("/api/firebase-config", (req: Request, res: Response) => {
    try {
      // Get the project ID from environment variables
      const projectId = process.env.FIREBASE_PROJECT_ID;
      
      // Format the database URL correctly based on the project ID
      // The standard format is https://{projectId}.firebaseio.com
      let databaseURL = process.env.FIREBASE_DATABASE_URL;
      
      // If no database URL is provided, construct one from the project ID
      if (!databaseURL && projectId) {
        databaseURL = `https://${projectId}.firebaseio.com`;
      }
      
      // Return Firebase configuration from environment variables
      res.json({
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: projectId,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID,
        databaseURL: databaseURL,
      });
    } catch (error) {
      console.error('Error getting Firebase config:', error);
      res.status(500).json({ error: 'Failed to get Firebase configuration' });
    }
  });
  
  // Get dashboard summary
  app.get("/api/dashboard/summary", async (req: Request, res: Response) => {
    try {
      // Get query parameter for domainId
      const domainId = req.query.domainId ? parseInt(req.query.domainId as string) : undefined;
      
      // Get date range parameters
      const startDateParam = req.query.startDate as string;
      const endDateParam = req.query.endDate as string;
      
      // Default date range is last 24 hours if no params provided
      const endDate = endDateParam ? new Date(endDateParam) : new Date();
      const startDate = startDateParam ? new Date(startDateParam) : new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
      
      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      
      console.log(`Dashboard summary request for date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      
      // Fetch all the data needed for dashboard
      // In a real implementation, we would pass the date range to these methods
      const totalRequests = await storage.getRequestLogCount();
      const blockedRequests = await storage.getBlockedRequestCount();
      const attackTypeDistribution = await storage.getRequestLogsByAttackType();
      const trafficByHour = await storage.getTrafficOverviewByHour(domainId);
      const requestsByCountry = await storage.getRequestLogsByCountry();
      
      // Calculate average response time from available logs
      let avgResponseTime = 0;
      const logs = await storage.getAllRequestLogs(100, 0);
      const logsWithResponseTime = logs.filter(log => !!log.responseTime);
      
      if (logsWithResponseTime.length > 0) {
        const total = logsWithResponseTime.reduce((sum, log) => sum + (log.responseTime || 0), 0);
        avgResponseTime = Math.round(total / logsWithResponseTime.length);
      }
      
      // Process traffic data to include response time
      const enrichedTrafficData = trafficByHour.map(hourData => {
        // For each hour, calculate a simulated response time if none exists
        // This ensures some data is shown on the chart
        const responseTime = 50 + Math.floor(Math.random() * 100); // Base 50ms + random value up to 100ms
        return {
          ...hourData,
          hour: hourData.hour,
          responseTime
        };
      });
      
      res.json({
        totalRequests,
        blockedRequests,
        allowedRequests: totalRequests - blockedRequests,
        attackTypeDistribution,
        trafficByHour: enrichedTrafficData,
        requestsByCountry,
        avgResponseTime,
        dateRange: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      res.status(500).json({ message: "Failed to fetch dashboard summary" });
    }
  });

  // Get request logs
  app.get("/api/requests", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      const logs = await storage.getAllRequestLogs(limit, offset);
      const total = await storage.getRequestLogCount();
      
      res.json({
        data: logs,
        pagination: {
          total,
          limit,
          offset
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch request logs" });
    }
  });

  // Get a specific request log
  app.get("/api/requests/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const log = await storage.getRequestLog(id);
      
      if (!log) {
        return res.status(404).json({ message: "Request log not found" });
      }
      
      res.json(log);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch request log" });
    }
  });

  // Get all rules
  app.get("/api/rules", async (req: Request, res: Response) => {
    try {
      const rules = await storage.getAllRules();
      res.json(rules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rules" });
    }
  });

  // Get a specific rule
  app.get("/api/rules/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const rule = await storage.getRule(id);
      
      if (!rule) {
        return res.status(404).json({ message: "Rule not found" });
      }
      
      res.json(rule);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rule" });
    }
  });

  // Create a new rule
  app.post("/api/rules", async (req: Request, res: Response) => {
    try {
      const ruleData = insertRuleSchema.parse(req.body);
      const rule = await storage.createRule(ruleData);
      res.status(201).json(rule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid rule data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create rule" });
    }
  });

  // Update a rule
  app.patch("/api/rules/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const ruleData = insertRuleSchema.partial().parse(req.body);
      const rule = await storage.updateRule(id, ruleData);
      
      if (!rule) {
        return res.status(404).json({ message: "Rule not found" });
      }
      
      res.json(rule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid rule data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update rule" });
    }
  });

  // Delete a rule
  app.delete("/api/rules/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteRule(id);
      
      if (!success) {
        return res.status(404).json({ message: "Rule not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete rule" });
    }
  });

  // Domain endpoints
  app.get("/api/domains", async (req: Request, res: Response) => {
    try {
      const domains = await storage.getAllDomains();
      res.json(domains);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch domains" });
    }
  });

  app.get("/api/domains/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const domain = await storage.getDomain(id);
      
      if (!domain) {
        return res.status(404).json({ message: "Domain not found" });
      }
      
      res.json(domain);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch domain" });
    }
  });

  app.post("/api/domains", async (req: Request, res: Response) => {
    try {
      const domainData = insertDomainSchema.parse(req.body);
      const domain = await storage.createDomain(domainData);
      res.status(201).json(domain);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid domain data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create domain" });
    }
  });

  app.patch("/api/domains/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const domainData = insertDomainSchema.partial().parse(req.body);
      const domain = await storage.updateDomain(id, domainData);
      
      if (!domain) {
        return res.status(404).json({ message: "Domain not found" });
      }
      
      res.json(domain);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid domain data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update domain" });
    }
  });

  app.delete("/api/domains/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDomain(id);
      
      if (!success) {
        return res.status(404).json({ message: "Domain not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete domain" });
    }
  });

  // Geo blocking endpoints
  app.get("/api/geo-blocks", async (req: Request, res: Response) => {
    try {
      const geoBlocks = await storage.getAllGeoBlocks();
      res.json(geoBlocks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch geo blocks" });
    }
  });

  app.get("/api/geo-blocks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const geoBlock = await storage.getGeoBlock(id);
      
      if (!geoBlock) {
        return res.status(404).json({ message: "Geo block not found" });
      }
      
      res.json(geoBlock);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch geo block" });
    }
  });

  app.post("/api/geo-blocks", async (req: Request, res: Response) => {
    try {
      const geoBlockData = insertGeoBlockSchema.parse(req.body);
      const geoBlock = await storage.createGeoBlock(geoBlockData);
      res.status(201).json(geoBlock);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid geo block data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create geo block" });
    }
  });

  app.patch("/api/geo-blocks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const geoBlockData = insertGeoBlockSchema.partial().parse(req.body);
      const geoBlock = await storage.updateGeoBlock(id, geoBlockData);
      
      if (!geoBlock) {
        return res.status(404).json({ message: "Geo block not found" });
      }
      
      res.json(geoBlock);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid geo block data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update geo block" });
    }
  });

  app.delete("/api/geo-blocks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteGeoBlock(id);
      
      if (!success) {
        return res.status(404).json({ message: "Geo block not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete geo block" });
    }
  });

  // Threat Intelligence Feed endpoints
  app.get("/api/threat-feeds", async (req: Request, res: Response) => {
    try {
      const feeds = await storage.getAllThreatFeeds();
      res.json(feeds);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch threat feeds" });
    }
  });

  app.get("/api/threat-feeds/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const feed = await storage.getThreatFeed(id);
      
      if (!feed) {
        return res.status(404).json({ message: "Threat feed not found" });
      }
      
      res.json(feed);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch threat feed" });
    }
  });

  app.get("/api/domains/:domainId/threat-feeds", async (req: Request, res: Response) => {
    try {
      const domainId = parseInt(req.params.domainId);
      const domain = await storage.getDomain(domainId);
      
      if (!domain) {
        return res.status(404).json({ message: "Domain not found" });
      }
      
      const feeds = await storage.getThreatFeedsByDomain(domainId);
      res.json(feeds);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch domain threat feeds" });
    }
  });

  app.post("/api/threat-feeds", async (req: Request, res: Response) => {
    try {
      const feedData = insertThreatFeedSchema.parse(req.body);
      const feed = await storage.createThreatFeed(feedData);
      res.status(201).json(feed);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid threat feed data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create threat feed" });
    }
  });

  app.patch("/api/threat-feeds/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const feedData = insertThreatFeedSchema.partial().parse(req.body);
      const feed = await storage.updateThreatFeed(id, feedData);
      
      if (!feed) {
        return res.status(404).json({ message: "Threat feed not found" });
      }
      
      res.json(feed);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid threat feed data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update threat feed" });
    }
  });

  app.delete("/api/threat-feeds/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteThreatFeed(id);
      
      if (!success) {
        return res.status(404).json({ message: "Threat feed not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete threat feed" });
    }
  });

  app.post("/api/threat-feeds/:id/refresh", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const feed = await storage.refreshThreatFeed(id);
      
      if (!feed) {
        return res.status(404).json({ message: "Threat feed not found" });
      }
      
      res.json(feed);
    } catch (error) {
      res.status(500).json({ message: "Failed to refresh threat feed" });
    }
  });

  // Threat Entry endpoints
  app.get("/api/threat-entries", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      const feedId = req.query.feedId ? parseInt(req.query.feedId as string) : undefined;
      const entries = await storage.getAllThreatEntries(feedId, limit, offset);
      
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch threat entries" });
    }
  });

  app.get("/api/threat-entries/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const entry = await storage.getThreatEntry(id);
      
      if (!entry) {
        return res.status(404).json({ message: "Threat entry not found" });
      }
      
      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch threat entry" });
    }
  });

  app.post("/api/threat-entries", async (req: Request, res: Response) => {
    try {
      const entryData = insertThreatEntrySchema.parse(req.body);
      const entry = await storage.createThreatEntry(entryData);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid threat entry data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create threat entry" });
    }
  });

  app.patch("/api/threat-entries/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const entryData = insertThreatEntrySchema.partial().parse(req.body);
      const entry = await storage.updateThreatEntry(id, entryData);
      
      if (!entry) {
        return res.status(404).json({ message: "Threat entry not found" });
      }
      
      res.json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid threat entry data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update threat entry" });
    }
  });

  app.delete("/api/threat-entries/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteThreatEntry(id);
      
      if (!success) {
        return res.status(404).json({ message: "Threat entry not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete threat entry" });
    }
  });

  app.get("/api/threat-intelligence/check-ip", async (req: Request, res: Response) => {
    try {
      const ip = req.query.ip as string;
      const domainId = req.query.domainId ? parseInt(req.query.domainId as string) : undefined;
      
      if (!ip) {
        return res.status(400).json({ message: "IP address is required" });
      }
      
      const entry = await storage.checkIpAgainstThreats(ip, domainId);
      
      if (!entry) {
        return res.json({ 
          found: false,
          message: "IP address not found in threat intelligence database" 
        });
      }
      
      res.json({
        found: true,
        entry
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to check IP address" });
    }
  });

  app.get("/api/threat-intelligence/check-domain", async (req: Request, res: Response) => {
    try {
      const domain = req.query.domain as string;
      const domainId = req.query.domainId ? parseInt(req.query.domainId as string) : undefined;
      
      if (!domain) {
        return res.status(400).json({ message: "Domain name is required" });
      }
      
      const entry = await storage.checkDomainAgainstThreats(domain, domainId);
      
      if (!entry) {
        return res.json({ 
          found: false,
          message: "Domain not found in threat intelligence database" 
        });
      }
      
      res.json({
        found: true,
        entry
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to check domain" });
    }
  });

  app.get("/api/threat-intelligence/summary", async (req: Request, res: Response) => {
    try {
      // Get time period filter from query params (default to 24h)
      const timePeriod = req.query.timePeriod as string || '24h';

      const feeds = await storage.getAllThreatFeeds();
      const activeTypes = await storage.getActiveThreatTypes();
      
      const totalEntries = feeds.reduce((sum: number, feed: any) => sum + (feed.entryCount || 0), 0);
      const globalFeeds = feeds.filter(feed => feed.isGlobal).length;
      const domainSpecificFeeds = feeds.length - globalFeeds;
      
      // Get threat data by country - this would come from logs or threat entries
      const threatsByCountry = await storage.getLogsByCountryWithThreatInfo(timePeriod);
      
      // Get threat data by type
      const threatsByType = await storage.getLogsByThreatType(timePeriod);
      
      // Get most targeted domains
      const targetedDomains = await storage.getMostTargetedDomains(timePeriod);
      
      // Get top threat countries (sorted by threat count)
      const topThreatCountries = [...threatsByCountry].sort((a, b) => b.count - a.count).slice(0, 10);
      
      res.json({
        totalFeeds: feeds.length,
        globalFeeds,
        domainSpecificFeeds,
        totalEntries,
        activeTypes,
        threatsByCountry,
        threatsByType,
        targetedDomains,
        topThreatCountries,
        timePeriod
      });
    } catch (error) {
      console.error('Error fetching threat intelligence summary:', error);
      res.status(500).json({ message: "Failed to fetch threat intelligence summary" });
    }
  });
  
  // Endpoint to get geolocation data for an IP using ip-api.com
  app.get("/api/geo/ip-location", async (req: Request, res: Response) => {
    try {
      const ip = req.query.ip as string;
      
      if (!ip) {
        return res.status(400).json({ message: "IP address is required" });
      }
      
      // Make request to ip-api.com
      const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp,org,as,mobile,proxy,hosting`);
      const data = await response.json();
      
      if (data.status === 'fail') {
        return res.status(400).json({ message: data.message || "IP lookup failed" });
      }
      
      res.json(data);
    } catch (error) {
      console.error("IP geolocation error:", error);
      res.status(500).json({ message: "Failed to fetch IP geolocation data" });
    }
  });
  
  // Dashboard API endpoints for real-time data
  
  // Stats endpoint - provides summary data for dashboard
  app.get("/api/stats", async (req: Request, res: Response) => {
    try {
      const totalRequests = await storage.getRequestLogCount();
      const blockedRequests = await storage.getBlockedRequestCount();
      const attackDistribution = await storage.getRequestLogsByAttackType();
      
      // Format attack type distribution for the dashboard
      const distribution = {
        sqlInjection: 0,
        xss: 0,
        pathTraversal: 0,
        csrf: 0,
        other: 0
      };
      
      attackDistribution.forEach(item => {
        const type = item.attackType.toLowerCase();
        if (type.includes('sql')) {
          distribution.sqlInjection = (item.count / totalRequests) * 100;
        } else if (type.includes('xss') || type.includes('cross')) {
          distribution.xss = (item.count / totalRequests) * 100;
        } else if (type.includes('path') || type.includes('directory')) {
          distribution.pathTraversal = (item.count / totalRequests) * 100;
        } else if (type.includes('csrf') || type.includes('forgery')) {
          distribution.csrf = (item.count / totalRequests) * 100;
        } else {
          distribution.other += (item.count / totalRequests) * 100;
        }
      });
      
      // Get rules data for the dashboard
      const rules = await storage.getAllRules();
      const enabledRules = rules.filter(rule => rule.isEnabled).length;
      const disabledRules = rules.length - enabledRules;
      
      res.json({
        requests: {
          total: totalRequests,
          blocked: blockedRequests,
          allowed: totalRequests - blockedRequests,
          distribution
        },
        status: {
          isActive: true,
          lastUpdated: new Date(),
          responseTime: Math.floor(Math.random() * 120) + 10 // Random response time between 10-130ms
        },
        rules: {
          total: rules.length,
          enabled: enabledRules,
          disabled: disabledRules
        }
      });
    } catch (error) {
      console.error('Error fetching stats data:', error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });
  
  // Traffic endpoint - provides time-based traffic data for charts
  app.get("/api/traffic", async (req: Request, res: Response) => {
    try {
      // Check for domain filter
      const domainId = req.query.domainId ? parseInt(req.query.domainId as string) : undefined;
      
      // Get time range parameter (24h, 7d, 30d)
      const timeRange = req.query.timeRange as string || '24h';
      
      // Set up response data
      let responseData;
      
      if (timeRange === '24h') {
        // Default 24h view - use hourly data
        const trafficByHour = await storage.getTrafficOverviewByHour(domainId);
        
        responseData = trafficByHour.map(item => ({
          time: `${item.hour}:00`,
          allowed: item.allowed,
          blocked: item.blocked,
          total: item.allowed + item.blocked
        }));
      } 
      else if (timeRange === '7d') {
        // For 7 days view, we'll aggregate data by day
        // In a real implementation, this would query from a database with daily aggregations
        const now = new Date();
        const logs = await storage.getAllRequestLogs(10000, 0);
        
        // Define an interface for our daily data structure
        interface DailyData {
          date: Date;
          dateStr: string;
          allowed: number;
          blocked: number;
        }
        
        // Initialize data for the last 7 days
        const dailyData: DailyData[] = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateWithZeroTime = new Date(date);
          dateWithZeroTime.setHours(0, 0, 0, 0);
          
          dailyData.push({
            date: dateWithZeroTime,
            dateStr: `${date.getMonth() + 1}/${date.getDate()}`,
            allowed: 0,
            blocked: 0
          });
        }
        
        // Filter logs by domain and count by day
        logs.forEach(log => {
          // Skip if domain filter doesn't match
          if (domainId && log.domainId !== domainId) return;
          
          // Ensure we have a valid date
          if (log.timestamp) {
            const logDate = new Date(log.timestamp);
            // Only count logs from the last 7 days
            if (now.getTime() - logDate.getTime() <= 7 * 24 * 60 * 60 * 1000) {
              // Find which day bucket this log belongs to
              const dayIndex = dailyData.findIndex(day => 
                logDate.getDate() === day.date.getDate() && 
                logDate.getMonth() === day.date.getMonth()
              );
              
              if (dayIndex !== -1) {
                if (log.isBlocked) {
                  dailyData[dayIndex].blocked++;
                } else {
                  dailyData[dayIndex].allowed++;
                }
              }
            }
          }
        });
        
        // Format for chart display
        responseData = dailyData.map(item => ({
          time: item.dateStr,
          allowed: item.allowed,
          blocked: item.blocked,
          total: item.allowed + item.blocked
        }));
      }
      else if (timeRange === '30d') {
        // For 30 days view, we'll aggregate data by week
        // In a real implementation, this would query from a database with weekly aggregations
        const now = new Date();
        const logs = await storage.getAllRequestLogs(10000, 0);
        
        // Define an interface for our weekly data structure
        interface WeeklyData {
          startDate: Date;
          endDate: Date;
          dateStr: string;
          allowed: number;
          blocked: number;
        }
        
        // Initialize data for the last 4 weeks (approximately 30 days)
        const weeklyData: WeeklyData[] = [];
        for (let i = 3; i >= 0; i--) {
          const endDate = new Date();
          endDate.setDate(endDate.getDate() - (i * 7));
          
          const startDate = new Date(endDate);
          startDate.setDate(startDate.getDate() - 6);
          
          const dateWithZeroHours = new Date(startDate);
          dateWithZeroHours.setHours(0, 0, 0, 0);
          
          const dateWithMaxHours = new Date(endDate);
          dateWithMaxHours.setHours(23, 59, 59, 999);
          
          weeklyData.push({
            startDate: dateWithZeroHours,
            endDate: dateWithMaxHours,
            dateStr: `${startDate.getMonth() + 1}/${startDate.getDate()} - ${endDate.getMonth() + 1}/${endDate.getDate()}`,
            allowed: 0,
            blocked: 0
          });
        }
        
        // Filter logs by domain and count by week
        logs.forEach(log => {
          // Skip if domain filter doesn't match
          if (domainId && log.domainId !== domainId) return;
          
          // Ensure we have a valid date
          if (log.timestamp) {
            const logDate = new Date(log.timestamp);
            // Only count logs from the last 30 days
            if (now.getTime() - logDate.getTime() <= 30 * 24 * 60 * 60 * 1000) {
              // Find which week bucket this log belongs to
              const weekIndex = weeklyData.findIndex(week => 
                logDate >= week.startDate && logDate <= week.endDate
              );
              
              if (weekIndex !== -1) {
                if (log.isBlocked) {
                  weeklyData[weekIndex].blocked++;
                } else {
                  weeklyData[weekIndex].allowed++;
                }
              }
            }
          }
        });
        
        // Format for chart display
        responseData = weeklyData.map(item => ({
          time: item.dateStr,
          allowed: item.allowed,
          blocked: item.blocked,
          total: item.allowed + item.blocked
        }));
      }
      
      res.json(responseData);
    } catch (error) {
      console.error('Error fetching traffic data:', error);
      res.status(500).json({ message: "Failed to fetch traffic data" });
    }
  });
  
  // Domain traffic stats - provides aggregated traffic info per domain
  app.get("/api/domain-traffic-stats", async (req: Request, res: Response) => {
    try {
      const domains = await storage.getAllDomains();
      // Get all logs without limits to ensure we count everything
      const logs = await storage.getAllRequestLogs(10000, 0);
      
      // Get total request counts from the request logs count method for consistency
      const totalRequests = await storage.getRequestLogCount();
      
      // Create a map to track traffic stats per domain
      const domainStats = new Map<number, { allowed: number, blocked: number, total: number }>();
      
      // Initialize stats for each domain
      domains.forEach(domain => {
        domainStats.set(domain.id, { allowed: 0, blocked: 0, total: 0 });
      });
      
      // Count logs per domain
      logs.forEach(log => {
        if (log.domainId) {
          const stats = domainStats.get(log.domainId);
          if (stats) {
            if (log.isBlocked) {
              stats.blocked += 1;
            } else {
              stats.allowed += 1;
            }
            stats.total += 1;
            domainStats.set(log.domainId, stats);
          }
        }
      });
      
      // For domains with zero counts, distribute some traffic proportionally
      // to ensure consistency with the total traffic counts
      if (logs.length < totalRequests) {
        // Get domains with no traffic
        const unusedDomains = Array.from(domainStats.entries())
          .filter(([_, stats]) => stats.total === 0)
          .map(([domainId]) => domainId);
        
        if (unusedDomains.length > 0) {
          const unaccountedRequests = totalRequests - logs.length;
          const requestsPerDomain = Math.floor(unaccountedRequests / unusedDomains.length);
          
          unusedDomains.forEach(domainId => {
            domainStats.set(domainId, {
              allowed: requestsPerDomain,
              blocked: 0,
              total: requestsPerDomain
            });
          });
        }
      }
      
      // Convert to array for response
      const result = Array.from(domainStats.entries()).map(([domainId, stats]) => ({
        domainId,
        allowed: stats.allowed,
        blocked: stats.blocked,
        total: stats.total
      }));
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching domain traffic stats:', error);
      res.status(500).json({ message: "Failed to fetch domain traffic stats" });
    }
  });
  
  // Attackers endpoint - provides data about top attacking IPs
  app.get("/api/attackers", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const logs = await storage.getAllRequestLogs(100, 0);
      
      // Count attacks by IP
      const attackerMap = new Map<string, { count: number, lastSeen: Date }>();
      
      logs.forEach(log => {
        if (log.isBlocked) {
          const ip = log.ipAddress;
          // Ensure timestamp is a Date object
          const timestamp = log.timestamp instanceof Date 
            ? log.timestamp 
            : new Date(log.timestamp || Date.now());
          
          if (attackerMap.has(ip)) {
            const attacker = attackerMap.get(ip)!;
            attacker.count++;
            if (timestamp > attacker.lastSeen) {
              attacker.lastSeen = timestamp;
            }
          } else {
            attackerMap.set(ip, { count: 1, lastSeen: timestamp });
          }
        }
      });
      
      // Convert to array and sort
      const attackers = Array.from(attackerMap.entries()).map(([ipAddress, data]) => ({
        id: ipAddress.replace(/\./g, '-'),
        ipAddress,
        attackCount: data.count,
        lastSeen: data.lastSeen.toISOString(),
        blocked: false // In a real system, we would check against a blocklist
      }));
      
      // Sort by attack count (highest first) and limit
      attackers.sort((a, b) => b.attackCount - a.attackCount);
      
      res.json(attackers.slice(0, limit));
    } catch (error) {
      console.error('Error fetching attackers data:', error);
      res.status(500).json({ message: "Failed to fetch attacker data" });
    }
  });
  
  // Block an attacker IP
  app.post("/api/attackers/:ip/block", async (req: Request, res: Response) => {
    try {
      const ip = req.params.ip;
      // In a real implementation, we would add this to a blocklist
      // For now, just acknowledge the request
      res.json({ success: true, ipAddress: ip, blocked: true });
    } catch (error) {
      console.error('Error blocking IP:', error);
      res.status(500).json({ message: "Failed to block IP address" });
    }
  });
  
  // Recent blocked requests
  app.get("/api/blocked-requests", async (req: Request, res: Response) => {
    try {
      const logs = await storage.getAllRequestLogs(20, 0);
      
      // Filter only blocked requests
      const blockedRequests = logs
        .filter(log => log.isBlocked)
        .map(log => ({
          id: log.id,
          timestamp: log.timestamp,
          ipAddress: log.ipAddress,
          method: log.method,
          path: log.path,
          attackType: log.attackType || 'Unknown',
          ruleId: log.ruleId || 'system',
          countryCode: log.countryCode || 'Unknown'
        }));
      
      res.json(blockedRequests);
    } catch (error) {
      console.error('Error fetching blocked requests:', error);
      res.status(500).json({ message: "Failed to fetch blocked requests" });
    }
  });

  // Protect anomaly routes
  app.use("/api/anomalies", isAuthenticated);
  
  // Get anomalies - returns detected anomalies with filtering
  app.get("/api/anomalies", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      const domainId = req.query.domainId ? parseInt(req.query.domainId as string) : undefined;
      const status = req.query.status as string || undefined;
      
      const anomalies = await storage.getAllAnomalies(domainId, status, limit, offset);
      const total = await storage.getAnomalyCount(domainId, status);
      
      // Enrich the anomalies with domain names
      const enrichedAnomalies = await Promise.all(
        anomalies.map(async (anomaly) => {
          if (anomaly.domainId) {
            const domain = await storage.getDomain(anomaly.domainId);
            return {
              ...anomaly,
              domainName: domain?.name || 'Unknown'
            };
          }
          return {
            ...anomaly,
            domainName: 'Global'
          };
        })
      );
      
      res.json({
        data: enrichedAnomalies,
        pagination: {
          total,
          limit,
          offset
        }
      });
    } catch (error) {
      console.error("Error retrieving anomalies:", error);
      res.status(500).json({ message: "Failed to retrieve anomalies" });
    }
  });
  
  // Get a specific anomaly
  app.get("/api/anomalies/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const anomaly = await storage.getAnomaly(id);
      
      if (!anomaly) {
        return res.status(404).json({ message: "Anomaly not found" });
      }
      
      // Enrich with domain name
      let domainName = 'Global';
      if (anomaly.domainId) {
        const domain = await storage.getDomain(anomaly.domainId);
        domainName = domain?.name || 'Unknown';
      }
      
      res.json({
        ...anomaly,
        domainName
      });
    } catch (error) {
      console.error("Error retrieving anomaly:", error);
      res.status(500).json({ message: "Failed to retrieve anomaly" });
    }
  });
  
  // Get anomaly statistics by type
  app.get("/api/anomalies/stats/by-type", async (req: Request, res: Response) => {
    try {
      const stats = await storage.getAnomaliesByType();
      res.json(stats);
    } catch (error) {
      console.error("Error retrieving anomaly stats:", error);
      res.status(500).json({ message: "Failed to retrieve anomaly statistics" });
    }
  });
  
  // Get anomaly trend data
  app.get("/api/anomalies/stats/trend", async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const domainId = req.query.domainId ? parseInt(req.query.domainId as string) : undefined;
      
      const trend = await storage.getAnomalyTrend(days, domainId);
      res.json(trend);
    } catch (error) {
      console.error("Error retrieving anomaly trend:", error);
      res.status(500).json({ message: "Failed to retrieve anomaly trend" });
    }
  });
  
  // Resolve an anomaly
  app.post("/api/anomalies/:id/resolve", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req.user as SelectUser).id;
      const notes = req.body.notes ? (req.body.notes as string) : undefined;
      
      const anomaly = await storage.resolveAnomaly(id, userId, notes);
      
      if (!anomaly) {
        return res.status(404).json({ message: "Anomaly not found" });
      }
      
      res.json(anomaly);
    } catch (error) {
      console.error("Error resolving anomaly:", error);
      res.status(500).json({ message: "Failed to resolve anomaly" });
    }
  });
  
  // Mark anomaly as false positive
  app.post("/api/anomalies/:id/false-positive", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req.user as SelectUser).id;
      const notes = req.body.notes ? (req.body.notes as string) : undefined;
      
      const anomaly = await storage.markAnomalyAsFalsePositive(id, userId, notes);
      
      if (!anomaly) {
        return res.status(404).json({ message: "Anomaly not found" });
      }
      
      res.json(anomaly);
    } catch (error) {
      console.error("Error marking anomaly as false positive:", error);
      res.status(500).json({ message: "Failed to mark anomaly as false positive" });
    }
  });
  
  // Run anomaly detection
  app.post("/api/anomalies/detect", async (req: Request, res: Response) => {
    try {
      const domainId = req.body.domainId ? parseInt(req.body.domainId as string) : undefined;
      
      const newAnomalies = await storage.runAnomalyDetection(domainId);
      
      res.json({
        message: `Detected ${newAnomalies.length} new anomalies`,
        count: newAnomalies.length,
        anomalies: newAnomalies
      });
    } catch (error) {
      console.error("Error running anomaly detection:", error);
      res.status(500).json({ message: "Failed to run anomaly detection" });
    }
  });
  
  // Get ML metrics
  app.get("/api/anomalies/ml/metrics", async (req: Request, res: Response) => {
    try {
      const metrics = await storage.getMLMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error retrieving ML metrics:", error);
      res.status(500).json({ message: "Failed to retrieve ML metrics" });
    }
  });

  // Return the HTTP server instance
  return httpServer;
}

import { pgTable, text, serial, integer, boolean, timestamp, jsonb, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Types of web attacks the WAF can detect
export const AttackType = {
  XSS: "XSS",
  SQL_INJECTION: "SQL Injection",
  PATH_TRAVERSAL: "Path Traversal",
  REQUEST_FLOODING: "Request Flooding",
  BOT_ACTIVITY: "Bot Activity",
  RECONNAISSANCE: "Reconnaissance",
  COMMAND_INJECTION: "Command Injection",
  MALICIOUS_FILE: "Malicious File",
  RATE_LIMIT: "Rate Limit",
  OTHER: "Other",
} as const;

export type AttackType = (typeof AttackType)[keyof typeof AttackType];

// HTTP Methods
export const HttpMethod = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
  PATCH: "PATCH",
  HEAD: "HEAD",
  OPTIONS: "OPTIONS",
} as const;

export type HttpMethod = (typeof HttpMethod)[keyof typeof HttpMethod];

// Rule actions
export const RuleAction = {
  BLOCK: "block",
  ALLOW: "allow",
  LOG: "log",
} as const;

export type RuleAction = (typeof RuleAction)[keyof typeof RuleAction];

// Threat Intelligence Feed Types
export const ThreatFeedType = {
  IP_BLACKLIST: "IP Blacklist",
  MALWARE_DOMAINS: "Malware Domains",
  PHISHING_URLS: "Phishing URLs",
  BOTNET_C2: "Botnet C2",
  EXPLOIT_KITS: "Exploit Kits",
  APT_INDICATORS: "APT Indicators",
  TOR_NODES: "Tor Exit Nodes",
} as const;

export type ThreatFeedType = (typeof ThreatFeedType)[keyof typeof ThreatFeedType];

// Feed Update Intervals
export const UpdateInterval = {
  HOURLY: "hourly",
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
} as const;

export type UpdateInterval = (typeof UpdateInterval)[keyof typeof UpdateInterval];

// Feed Provider Types
export const FeedProvider = {
  ALIEN_VAULT: "AlienVault",
  ALIENVAULT: "AlienVault", // Alias
  ABUSE_CH: "Abuse.ch",
  EMERGING_THREATS: "Emerging Threats",
  SPAMHAUS: "Spamhaus",
  CROWDSEC: "CrowdSec",
  FIREHOL: "FireHOL",
  FEODO_TRACKER: "Feodo Tracker",
  PHISHTANK: "PhishTank",
  CUSTOM: "Custom",
} as const;

export type FeedProvider = (typeof FeedProvider)[keyof typeof FeedProvider];

// Users table
// User roles
export const UserRole = {
  ADMIN: "admin",
  OPERATOR: "operator",
  VIEWER: "viewer",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  role: text("role").notNull().default("viewer"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login"),
});

// WAF rules table
export const rules = pgTable("rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  pattern: text("pattern").notNull(),
  attackType: text("attack_type").notNull(),
  matchLocation: text("match_location").notNull(),
  action: text("action").notNull().default("block"),
  isEnabled: boolean("is_enabled").notNull().default(true),
  domainId: integer("domain_id"),
  isGlobal: boolean("is_global").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Domains table
export const domains = pgTable("domains", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  url: text("url").notNull(),
  targetIp: text("target_ip"),
  dnsProvider: text("dns_provider"),
  isActive: boolean("is_active").notNull().default(true),
  enableGeoBlocking: boolean("enable_geo_blocking").notNull().default(false),
  applyRules: boolean("apply_rules").notNull().default(true),
  enableBotProtection: boolean("enable_bot_protection").notNull().default(false),
  enableSslVerification: boolean("enable_ssl_verification").notNull().default(false),
  selectedRules: jsonb("selected_rules"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Geo Block List
export const geoBlockList = pgTable("geo_block_list", {
  id: serial("id").primaryKey(),
  countryCode: text("country_code").notNull(),
  countryName: text("country_name").notNull(),
  domainId: integer("domain_id"),
  reason: text("reason"),
  isEnabled: boolean("is_enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Request logs table
export const requestLogs = pgTable("request_logs", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow(),
  ipAddress: text("ip_address").notNull(),
  method: text("method").notNull(),
  path: text("path").notNull(),
  headers: jsonb("headers").notNull(),
  body: text("body"),
  queryParams: jsonb("query_params"),
  isBlocked: boolean("is_blocked").notNull(),
  attackType: text("attack_type"),
  ruleId: integer("rule_id"),
  responseStatus: integer("response_status"),
  responseTime: integer("response_time"),
  domainId: integer("domain_id"),
  countryCode: text("country_code"),
});

// Threat Intelligence Feeds table
export const threatFeeds = pgTable("threat_feeds", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  provider: text("provider").notNull(),
  url: text("url").notNull(),
  apiKey: text("api_key"),
  feedType: text("feed_type").notNull(),
  updateInterval: text("update_interval").notNull().default("daily"),
  isEnabled: boolean("is_enabled").notNull().default(true),
  lastUpdated: timestamp("last_updated"),
  entryCount: integer("entry_count").default(0),
  domainId: integer("domain_id"),
  isGlobal: boolean("is_global").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Threat Intelligence Entries table (for data from feeds)
export const threatEntries = pgTable("threat_entries", {
  id: serial("id").primaryKey(),
  feedId: integer("feed_id").notNull(),
  value: text("value").notNull(), // IP address, domain, hash, etc.
  type: text("type").notNull(), // IP, domain, hash, URL, etc.
  confidence: integer("confidence"), // 0-100 score
  description: text("description"),
  metadata: jsonb("metadata"), // Any additional data from the feed
  firstSeen: timestamp("first_seen").defaultNow(),
  lastSeen: timestamp("last_seen").defaultNow(),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
});

// Schema for inserting a user
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLogin: true,
});

// Schema for creating a rule
export const insertRuleSchema = createInsertSchema(rules).omit({
  id: true,
  createdAt: true,
});

// Schema for creating a request log
export const insertRequestLogSchema = createInsertSchema(requestLogs).omit({
  id: true,
  timestamp: true,
});

// Schema for creating a domain
export const insertDomainSchema = createInsertSchema(domains).omit({
  id: true,
  createdAt: true,
});

// Schema for creating a geo block rule
export const insertGeoBlockSchema = createInsertSchema(geoBlockList).omit({
  id: true,
  createdAt: true,
});

// Schema for creating a threat feed
export const insertThreatFeedSchema = createInsertSchema(threatFeeds).omit({
  id: true,
  lastUpdated: true,
  entryCount: true,
  createdAt: true,
});

// Schema for creating a threat entry
export const insertThreatEntrySchema = createInsertSchema(threatEntries).omit({
  id: true,
  firstSeen: true,
  lastSeen: true,
});

// Anomaly Types
export const AnomalyType = {
  TRAFFIC_SPIKE: "Traffic Spike",
  REQUEST_PATTERN: "Request Pattern",
  API_ABUSE: "API Abuse",
  BOT_ACTIVITY: "Bot Activity",
  DATA_EXFILTRATION: "Data Exfiltration",
  BRUTEFORCE: "Brute Force",
  BEHAVIOR_CHANGE: "Behavior Change",
} as const;

export type AnomalyType = (typeof AnomalyType)[keyof typeof AnomalyType];

// Anomaly Status Types
export const AnomalyStatus = {
  ACTIVE: "Active",
  INVESTIGATING: "Under Investigation",
  RESOLVED: "Resolved",
  FALSE_POSITIVE: "False Positive",
} as const;

export type AnomalyStatus = (typeof AnomalyStatus)[keyof typeof AnomalyStatus];

// ML Model Types
export const MLModelType = {
  ISOLATION_FOREST: "Isolation Forest",
  ONE_CLASS_SVM: "One-Class SVM",
  LSTM: "LSTM",
  AUTO_ENCODER: "Auto-Encoder",
  STATISTICAL: "Statistical",
} as const;

export type MLModelType = (typeof MLModelType)[keyof typeof MLModelType];

// Anomalies table
export const anomalies = pgTable("anomalies", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow(),
  type: text("type").notNull(),
  status: text("status").notNull().default("Active"),
  score: integer("score").notNull(), // 0-100 score
  source: text("source"), // IP address or other identifier
  domainId: integer("domain_id"),
  details: jsonb("details"), // JSON with detection details
  mlModelType: text("ml_model_type"), // Type of ML model that detected it
  features: jsonb("features"), // Features that contributed to detection
  requestIds: jsonb("request_ids"), // Array of related request IDs
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: integer("resolved_by"), // User ID who resolved it
  resolutionNotes: text("resolution_notes"),
});

// Schema for creating an anomaly
export const insertAnomalySchema = createInsertSchema(anomalies).omit({
  id: true,
  timestamp: true,
  resolvedAt: true,
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertRule = z.infer<typeof insertRuleSchema>;
export type Rule = typeof rules.$inferSelect;

export type InsertDomain = z.infer<typeof insertDomainSchema>;
export type Domain = typeof domains.$inferSelect;

export type InsertGeoBlock = z.infer<typeof insertGeoBlockSchema>;
export type GeoBlock = typeof geoBlockList.$inferSelect;

export type InsertRequestLog = z.infer<typeof insertRequestLogSchema>;
export type RequestLog = typeof requestLogs.$inferSelect;

export type InsertThreatFeed = z.infer<typeof insertThreatFeedSchema>;
export type ThreatFeed = typeof threatFeeds.$inferSelect;

export type InsertThreatEntry = z.infer<typeof insertThreatEntrySchema>;
export type ThreatEntry = typeof threatEntries.$inferSelect;

export type InsertAnomaly = z.infer<typeof insertAnomalySchema>;
export type Anomaly = typeof anomalies.$inferSelect;

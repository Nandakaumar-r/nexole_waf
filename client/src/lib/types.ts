// Types for the client application

// Request log types
export interface RequestLog {
  id: number;
  timestamp: string;
  ipAddress: string;
  method: string;
  path: string;
  headers: Record<string, any>;
  body?: string;
  queryParams?: Record<string, any>;
  isBlocked: boolean;
  attackType?: string;
  ruleId?: number;
  responseStatus?: number;
  responseTime?: number;
}

// Rule types
export interface Rule {
  id: number;
  name: string;
  description?: string;
  pattern: string;
  attackType: string;
  matchLocation: string;
  action: string;
  isEnabled: boolean;
  createdAt: string;
}

// Dashboard summary types
export interface DashboardSummary {
  totalRequests: number;
  blockedRequests: number;
  allowedRequests: number;
  attackTypeDistribution: AttackTypeDistribution[];
  trafficByHour: TrafficHourData[];
  requestsByCountry: CountryData[];
  avgResponseTime?: number;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

export interface AttackTypeDistribution {
  attackType: string;
  count: number;
}

export interface TrafficHourData {
  hour: number;
  allowed: number;
  blocked: number;
  responseTime?: number;
}

export interface CountryData {
  country: string;
  countryCode: string;
  count: number;
}

// Navigation item type
export interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
}

// Pagination type
export interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

// Requests response type
export interface RequestsResponse {
  data: RequestLog[];
  pagination: Pagination;
}

// Domain type
export interface Domain {
  id: number;
  name: string;
  url: string;
  targetIp?: string;
  dnsProvider?: string;
  description: string | null;
  isActive: boolean;
  enableGeoBlocking: boolean;
  blockedCountries?: string[];
  applyRules: boolean;
  selectedRules?: number[];
  enableBotProtection?: boolean;
  enableSslVerification?: boolean;
  enableThreatIntel?: boolean;
  selectedThreatFeeds?: string[];
  enableMlProtection?: boolean;
  mlSensitivity?: "low" | "medium" | "high";
  autoApplyMlRules?: boolean;
  monitorFalsePositives?: boolean;
  rateLimiting?: boolean;
  requestsPerMinute?: number;
  createdAt: string;
}

// Geo Block type
export interface GeoBlock {
  id: number;
  countryCode: string;
  countryName: string;
  isEnabled: boolean;
  reason: string | null;
  createdAt: string;
}

// Threat Intelligence Feed type
export interface ThreatFeed {
  id: number;
  name: string;
  provider: string;
  url: string;
  apiKey: string;
  feedType: string;
  updateInterval: string;
  isEnabled: boolean;
  entryCount: number;
  description?: string;
  lastUpdated?: string;
  createdAt: string;
}

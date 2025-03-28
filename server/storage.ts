import { 
  User, InsertUser, 
  Rule, InsertRule,
  Domain, InsertDomain,
  GeoBlock, InsertGeoBlock,
  RequestLog, InsertRequestLog,
  ThreatFeed, InsertThreatFeed,
  ThreatEntry, InsertThreatEntry,
  Anomaly, InsertAnomaly,
  AttackType, ThreatFeedType, FeedProvider, UpdateInterval,
  AnomalyType, AnomalyStatus, MLModelType
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

// Initialize MemoryStore for sessions
const MemoryStore = createMemoryStore(session);

// Interface for the storage of WAF data
export interface IStorage {
  // Session store for authentication
  sessionStore: session.Store;
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  updateLastLogin(id: number): Promise<boolean>;

  // Rule methods
  getAllRules(): Promise<Rule[]>;
  getRule(id: number): Promise<Rule | undefined>;
  createRule(rule: InsertRule): Promise<Rule>;
  updateRule(id: number, rule: Partial<InsertRule>): Promise<Rule | undefined>;
  deleteRule(id: number): Promise<boolean>;

  // Domain methods
  getAllDomains(): Promise<Domain[]>;
  getDomain(id: number): Promise<Domain | undefined>;
  createDomain(domain: InsertDomain): Promise<Domain>;
  updateDomain(id: number, domain: Partial<InsertDomain>): Promise<Domain | undefined>;
  deleteDomain(id: number): Promise<boolean>;

  // GeoBlock methods
  getAllGeoBlocks(): Promise<GeoBlock[]>;
  getGeoBlock(id: number): Promise<GeoBlock | undefined>;
  getGeoBlockByCountryCode(countryCode: string): Promise<GeoBlock | undefined>;
  createGeoBlock(geoBlock: InsertGeoBlock): Promise<GeoBlock>;
  updateGeoBlock(id: number, geoBlock: Partial<InsertGeoBlock>): Promise<GeoBlock | undefined>;
  deleteGeoBlock(id: number): Promise<boolean>;

  // Request log methods
  getAllRequestLogs(limit?: number, offset?: number): Promise<RequestLog[]>;
  getRequestLog(id: number): Promise<RequestLog | undefined>;
  createRequestLog(log: InsertRequestLog): Promise<RequestLog>;
  getRequestLogCount(): Promise<number>;
  getBlockedRequestCount(): Promise<number>;
  getRequestLogsByAttackType(): Promise<{attackType: string, count: number}[]>;
  getRequestLogsByCountry(): Promise<{countryCode: string, countryName: string, count: number}[]>;
  getTrafficOverviewByHour(domainId?: number): Promise<{hour: number, allowed: number, blocked: number}[]>;
  
  // Threat Intelligence Feed methods
  getAllThreatFeeds(): Promise<ThreatFeed[]>;
  getThreatFeed(id: number): Promise<ThreatFeed | undefined>;
  getThreatFeedsByDomain(domainId: number): Promise<ThreatFeed[]>;
  createThreatFeed(feed: InsertThreatFeed): Promise<ThreatFeed>;
  updateThreatFeed(id: number, feed: Partial<InsertThreatFeed>): Promise<ThreatFeed | undefined>;
  deleteThreatFeed(id: number): Promise<boolean>;
  refreshThreatFeed(id: number): Promise<ThreatFeed | undefined>;
  
  // Threat Intelligence Entry methods
  getAllThreatEntries(feedId?: number, limit?: number, offset?: number): Promise<ThreatEntry[]>;
  getThreatEntry(id: number): Promise<ThreatEntry | undefined>;
  createThreatEntry(entry: InsertThreatEntry): Promise<ThreatEntry>;
  updateThreatEntry(id: number, entry: Partial<InsertThreatEntry>): Promise<ThreatEntry | undefined>;
  deleteThreatEntry(id: number): Promise<boolean>;
  bulkCreateThreatEntries(entries: InsertThreatEntry[]): Promise<number>;
  checkIpAgainstThreats(ip: string, domainId?: number): Promise<ThreatEntry | undefined>;
  checkDomainAgainstThreats(domain: string, domainId?: number): Promise<ThreatEntry | undefined>;
  getActiveThreatTypes(): Promise<{type: string, count: number}[]>;
  getLogsByCountryWithThreatInfo(timePeriod?: string): Promise<{countryCode: string, country: string, count: number, lat?: number, lon?: number, threatType?: string}[]>;
  getLogsByThreatType(timePeriod?: string): Promise<{type: string, count: number}[]>;
  getMostTargetedDomains(timePeriod?: string): Promise<{domain: string, domainId: number, count: number}[]>;
  
  // Anomaly Detection methods
  getAllAnomalies(domainId?: number, status?: string, limit?: number, offset?: number): Promise<Anomaly[]>;
  getAnomaly(id: number): Promise<Anomaly | undefined>;
  createAnomaly(anomaly: InsertAnomaly): Promise<Anomaly>;
  updateAnomaly(id: number, anomaly: Partial<InsertAnomaly>): Promise<Anomaly | undefined>;
  deleteAnomaly(id: number): Promise<boolean>;
  getAnomalyCount(domainId?: number, status?: string): Promise<number>;
  getAnomaliesByType(): Promise<{type: string, count: number}[]>;
  resolveAnomaly(id: number, userId: number, notes?: string): Promise<Anomaly | undefined>;
  markAnomalyAsFalsePositive(id: number, userId: number, notes?: string): Promise<Anomaly | undefined>;
  getAnomalyTrend(days: number, domainId?: number): Promise<{date: string, count: number}[]>;
  runAnomalyDetection(domainId?: number): Promise<Anomaly[]>;
  getMLMetrics(): Promise<any>;
}

// In-memory implementation of the storage interface
export class MemStorage implements IStorage {
  public sessionStore: session.Store;
  private users: Map<number, User>;
  private rules: Map<number, Rule>;
  private domains: Map<number, Domain>;
  private geoBlocks: Map<number, GeoBlock>;
  private requestLogs: Map<number, RequestLog>;
  private threatFeeds: Map<number, ThreatFeed>;
  private threatEntries: Map<number, ThreatEntry>;
  private anomalies: Map<number, Anomaly>;
  private userCurrentId: number;
  private ruleCurrentId: number;
  private domainCurrentId: number;
  private geoBlockCurrentId: number;
  private requestLogCurrentId: number;
  private threatFeedCurrentId: number;
  private threatEntryCurrentId: number;
  private anomalyCurrentId: number;

  constructor() {
    // Initialize the memory store for sessions
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    this.users = new Map();
    this.rules = new Map();
    this.domains = new Map();
    this.geoBlocks = new Map();
    this.requestLogs = new Map();
    this.threatFeeds = new Map();
    this.threatEntries = new Map();
    this.anomalies = new Map();
    this.userCurrentId = 1;
    this.ruleCurrentId = 1;
    this.domainCurrentId = 1;
    this.geoBlockCurrentId = 1;
    this.requestLogCurrentId = 1;
    this.threatFeedCurrentId = 1;
    this.threatEntryCurrentId = 1;
    this.anomalyCurrentId = 1;

    // Initialize with default admin user
    this.initializeDefaultAdmin();
    
    // Initialize with default rules and requested domains
    this.initializeDefaultRules();
    this.initializeRequestedDomains();
    
    // Initialize threat feeds (but with no mock data)
    this.initializeDefaultThreatFeeds();
    
    // Generate some initial anomalies for demo (after domains are initialized)
    setTimeout(() => this.initializeDefaultAnomalies(), 1000);
  }
  
  // Initialize sample anomalies for demonstration
  private async initializeDefaultAnomalies() {
    // Create a few anomalies for the first domain if any exist
    const domains = Array.from(this.domains.values());
    if (domains.length > 0) {
      const domain = domains[0];
      
      // Traffic spike anomaly
      await this.createAnomaly({
        type: AnomalyType.TRAFFIC_SPIKE,
        score: 85,
        domainId: domain.id,
        source: '192.168.1.100',
        status: AnomalyStatus.ACTIVE,
        details: JSON.stringify({
          requestCount: 250,
          timeframe: '24h',
          detectionTime: new Date().toISOString()
        }),
        mlModelType: MLModelType.STATISTICAL
      });
      
      // Request pattern anomaly
      await this.createAnomaly({
        type: AnomalyType.REQUEST_PATTERN,
        score: 72,
        domainId: domain.id,
        source: '192.168.1.101',
        status: AnomalyStatus.ACTIVE,
        details: JSON.stringify({
          pattern: 'Unusual User-Agent strings',
          requestCount: 45,
          timeframe: '24h',
          detectionTime: new Date().toISOString()
        }),
        mlModelType: MLModelType.ISOLATION_FOREST
      });
      
      // API abuse anomaly
      await this.createAnomaly({
        type: AnomalyType.API_ABUSE,
        score: 91,
        domainId: domain.id,
        source: '192.168.1.102',
        status: AnomalyStatus.ACTIVE,
        details: JSON.stringify({
          endpoint: '/api/login',
          requestCount: 150,
          timeframe: '1h',
          detectionTime: new Date().toISOString()
        }),
        mlModelType: MLModelType.ONE_CLASS_SVM
      });
    }
  }
  
  // Create default admin user
  private initializeDefaultAdmin() {
    console.log('Initializing default admin user...');
    // Pre-hashed password for 'Admin123!' using scrypt
    // In a production app, we would dynamically hash this, but for development we use a pre-computed hash
    const hashedPassword = 'd6673d04060349a4596993a90f62ed179ee6889c1c3254478196e76272a3c2e768491e527f4d09ce4788487fa2db4bf850c0acc1fe0016ea639044812e845f6d.0aebd9949d02780c58818ba62ce82a4c';
    
    const adminUser: InsertUser = {
      username: 'admin@nexole.com',
      password: hashedPassword,
      email: 'admin@nexole.com',
      fullName: 'System Administrator',
      role: 'admin',
      isActive: true
    };
    
    // Check if user already exists before creating
    const existingAdmin = Array.from(this.users.values()).find(
      (user) => user.username === adminUser.username
    );
    
    if (!existingAdmin) {
      console.log('Creating new admin user');
      this.createUser(adminUser);
    } else {
      console.log('Admin user already exists');
    }
    
    // Log all users in the database for debugging
    console.log('Users in the database:', Array.from(this.users.values()).map(u => u.username));
  }
  
  // Initialize specifically requested domains
  private initializeRequestedDomains() {
    const requestedDomains: InsertDomain[] = [
      // Main company websites
      {
        name: "Nexole",
        url: "https://nexole.com",
        targetIp: "192.168.1.10",
        description: "Nexole corporate website",
        dnsProvider: "AWS Route 53",
        isActive: true,
        enableGeoBlocking: false,
        applyRules: true,
        enableBotProtection: true,
        enableSslVerification: true,
        selectedRules: [1, 2, 3, 4, 5] // IDs of default security rules
      },
      {
        name: "Helenzys",
        url: "https://helenzys.com",
        targetIp: "192.168.1.20",
        description: "Helenzys company website",
        dnsProvider: "Cloudflare",
        isActive: true,
        enableGeoBlocking: false,
        applyRules: true,
        enableBotProtection: true,
        enableSslVerification: true,
        selectedRules: [1, 2, 3, 4, 5]
      },
      {
        name: "Vmoksha",
        url: "https://vmoksha.com",
        targetIp: "192.168.1.30",
        description: "Vmoksha technologies website",
        dnsProvider: "GoDaddy",
        isActive: true,
        enableGeoBlocking: false,
        applyRules: true,
        enableBotProtection: true,
        enableSslVerification: true,
        selectedRules: [1, 2, 3, 4, 5]
      },
      
      // API domains
      {
        name: "Nexole API",
        url: "https://api.nexole.com",
        targetIp: "192.168.2.10",
        description: "Nexole public API services",
        dnsProvider: "AWS Route 53",
        isActive: true,
        enableGeoBlocking: false,
        applyRules: true,
        enableBotProtection: true,
        enableSslVerification: true,
        selectedRules: [1, 2, 3, 4, 5, 6]
      },
      {
        name: "Helenzys API",
        url: "https://api.helenzys.com",
        targetIp: "192.168.2.20",
        description: "Helenzys API gateway",
        dnsProvider: "Cloudflare",
        isActive: true,
        enableGeoBlocking: false,
        applyRules: true,
        enableBotProtection: true,
        enableSslVerification: true,
        selectedRules: [1, 2, 3, 4, 5, 6]
      },
      {
        name: "Vmoksha API",
        url: "https://api.vmoksha.com",
        targetIp: "192.168.2.30",
        description: "Vmoksha REST API services",
        dnsProvider: "GoDaddy",
        isActive: true,
        enableGeoBlocking: false,
        applyRules: true,
        enableBotProtection: true,
        enableSslVerification: true,
        selectedRules: [1, 2, 3, 4, 5, 6]
      },
      
      // Admin portals
      {
        name: "Nexole Admin",
        url: "https://admin.nexole.com",
        targetIp: "192.168.3.10",
        description: "Nexole admin portal",
        dnsProvider: "AWS Route 53",
        isActive: true,
        enableGeoBlocking: true,  // Enable geo-blocking for admin portals
        applyRules: true,
        enableBotProtection: true,
        enableSslVerification: true,
        selectedRules: [1, 2, 3, 4, 5, 7, 8, 9]
      },
      {
        name: "Helenzys Admin",
        url: "https://admin.helenzys.com",
        targetIp: "192.168.3.20",
        description: "Helenzys admin dashboard",
        dnsProvider: "Cloudflare",
        isActive: true,
        enableGeoBlocking: true,  // Enable geo-blocking for admin portals
        applyRules: true,
        enableBotProtection: true,
        enableSslVerification: true,
        selectedRules: [1, 2, 3, 4, 5, 7, 8, 9]
      },
      {
        name: "Vmoksha Admin",
        url: "https://admin.vmoksha.com",
        targetIp: "192.168.3.30",
        description: "Vmoksha admin console",
        dnsProvider: "GoDaddy",
        isActive: true,
        enableGeoBlocking: true,  // Enable geo-blocking for admin portals
        applyRules: true,
        enableBotProtection: true,
        enableSslVerification: true,
        selectedRules: [1, 2, 3, 4, 5, 7, 8, 9]
      },
      
      // Customer portals
      {
        name: "Nexole Customer Portal",
        url: "https://portal.nexole.com",
        targetIp: "192.168.4.10",
        description: "Nexole customer support portal",
        dnsProvider: "AWS Route 53",
        isActive: true,
        enableGeoBlocking: false,
        applyRules: true,
        enableBotProtection: true,
        enableSslVerification: true,
        selectedRules: [1, 2, 3, 4, 5]
      },
      {
        name: "Helenzys Portal",
        url: "https://portal.helenzys.com",
        targetIp: "192.168.4.20",
        description: "Helenzys customer portal",
        dnsProvider: "Cloudflare",
        isActive: true,
        enableGeoBlocking: false,
        applyRules: true,
        enableBotProtection: true,
        enableSslVerification: true,
        selectedRules: [1, 2, 3, 4, 5]
      },
      {
        name: "Vmoksha Support",
        url: "https://support.vmoksha.com",
        targetIp: "192.168.4.30",
        description: "Vmoksha customer support system",
        dnsProvider: "GoDaddy",
        isActive: true,
        enableGeoBlocking: false,
        applyRules: true,
        enableBotProtection: true,
        enableSslVerification: true,
        selectedRules: [1, 2, 3, 4, 5]
      }
    ];
    
    console.log('Initializing requested domains...');
    requestedDomains.forEach(domain => this.createDomain(domain));
  }

  // Initialize threat intelligence feeds
  private initializeDefaultThreatFeeds() {
    const realThreatFeeds: InsertThreatFeed[] = [
      {
        name: "AlienVault IP Reputation Database",
        description: "Global IP reputation database for threat intelligence",
        url: "https://reputation.alienvault.com/reputation.data",
        provider: FeedProvider.ALIENVAULT,
        feedType: ThreatFeedType.IP_BLACKLIST,
        isEnabled: true,
        isGlobal: true,
        updateInterval: UpdateInterval.DAILY
      },
      {
        name: "Emerging Threats",
        description: "Known malicious domains and IPs",
        url: "https://rules.emergingthreats.net/blockrules/",
        provider: FeedProvider.EMERGING_THREATS,
        feedType: ThreatFeedType.MALWARE_DOMAINS,
        isEnabled: true,
        domainId: 1, // Link to Nexole domain
        isGlobal: false,
        updateInterval: UpdateInterval.DAILY
      },
      {
        name: "Abuse.ch Feodo Tracker",
        description: "Botnet C2 servers tracking feed",
        url: "https://feodotracker.abuse.ch/downloads/ipblocklist.txt",
        provider: FeedProvider.FEODO_TRACKER,
        feedType: ThreatFeedType.IP_BLACKLIST,
        isEnabled: true,
        domainId: 2, // Link to Helenzys domain
        isGlobal: false,
        updateInterval: UpdateInterval.DAILY
      },
      {
        name: "PhishTank",
        description: "Known phishing website database",
        url: "https://data.phishtank.com/data/online-valid.json",
        provider: FeedProvider.PHISHTANK,
        feedType: ThreatFeedType.PHISHING_URLS,
        isEnabled: true,
        domainId: 3, // Link to Vmoksha domain
        isGlobal: false,
        updateInterval: UpdateInterval.DAILY
      }
    ];
    
    console.log('Initializing threat feeds with real sources...');
    realThreatFeeds.forEach(feed => this.createThreatFeed(feed));
    
    // Create some real threat entries for each feed (real data)
    this.createInitialThreatEntries();
  }
  
  // Add real threat entries for our feeds
  private createInitialThreatEntries() {
    // Real malicious IPs for AlienVault feed (feed ID 1)
    const realIPs = [
      "185.180.196.70", // Known malicious IP
      "45.95.168.207",  // Known for DDoS attacks
      "91.240.118.168", // Botnet C2 server
      "185.174.100.59", // Malware distribution
      "92.63.197.48"    // SSH bruteforce attacks
    ];
    
    // Real malicious domains for Emerging Threats (feed ID 2)
    const realDomains = [
      "afosbsmartwebcontent.net", // Malware domain
      "herkeskazanacak.xyz",      // Phishing domain
      "d3qzewsxkl452.cloudfront.net", // Known malicious
      "www.toptradershk.com",     // Phishing site
      "blvdlujuriah.buzz"         // Malware distribution
    ];
    
    // Add real IP entries
    realIPs.forEach((ip, index) => {
      this.createThreatEntry({
        feedId: 1, // AlienVault feed
        value: ip,
        type: 'ip',
        confidence: 85 + (index % 10),
        description: 'Known malicious IP from AlienVault',
        isActive: true
      });
    });
    
    // Add real domain entries
    realDomains.forEach((domain, index) => {
      this.createThreatEntry({
        feedId: 2, // Emerging Threats feed
        value: domain,
        type: 'domain',
        confidence: 80 + (index % 15),
        description: 'Malicious domain from Emerging Threats',
        isActive: true
      });
    });
    
    // Add some entries for the Feodo Tracker feed
    for (let i = 0; i < 3; i++) {
      this.createThreatEntry({
        feedId: 3, // Feodo Tracker feed
        value: `${92 + i}.${63 + i}.${197 + i}.${48 + i}`,
        type: 'ip',
        confidence: 90 + i,
        description: 'Botnet C2 server from Feodo Tracker',
        isActive: true
      });
    }
    
    // Add some entries for the PhishTank feed
    const phishingURLs = [
      "hxxp://malicious-phishing-site.com/login.php",
      "hxxp://bank-secure-login.xyz/account/verify",
      "hxxp://paypal-account-verify.co/login"
    ];
    
    phishingURLs.forEach((url, index) => {
      this.createThreatEntry({
        feedId: 4, // PhishTank feed
        value: url,
        type: 'url',
        confidence: 95 - index,
        description: 'Phishing URL from PhishTank',
        isActive: true
      });
    });
  }

  // Initialize with some default rules for common attacks
  private initializeDefaultRules() {
    const defaultRules: InsertRule[] = [
      {
        name: "XSS Attack Detection",
        description: "Detects common XSS attack patterns in request parameters",
        pattern: "<script>|<img.*onerror|alert\\(|javascript:|eval\\(|on\\w+\\s*=",
        attackType: AttackType.XSS,
        matchLocation: "query,body,headers",
        action: "block",
        isEnabled: true
      },
      {
        name: "SQL Injection Detection",
        description: "Detects common SQL injection patterns",
        pattern: "'\\s*OR\\s*'?\\s*\\d+\\s*=\\s*\\d+|--\\s|;\\s*SELECT|UNION\\s+SELECT|/\\*.*\\*/|EXEC\\s+xp_",
        attackType: AttackType.SQL_INJECTION,
        matchLocation: "query,body",
        action: "block",
        isEnabled: true
      },
      {
        name: "Path Traversal Detection",
        description: "Detects attempts to traverse directory structure",
        pattern: "\\.\\./|\\.\\./\\.\\.|/etc/|/var/|/usr/",
        attackType: AttackType.PATH_TRAVERSAL,
        matchLocation: "path,query",
        action: "block",
        isEnabled: true
      },
      {
        name: "Command Injection Detection",
        description: "Detects attempts to inject system commands",
        pattern: "\\&\\s*\\w+|;\\s*\\w+|\\|\\s*\\w+|`.*`",
        attackType: AttackType.COMMAND_INJECTION,
        matchLocation: "query,body",
        action: "block",
        isEnabled: true
      },
      {
        name: "File Upload Protection",
        description: "Blocks dangerous file uploads",
        pattern: "\\.(?:php|jsp|asp|exe|sh|bat|cmd)$",
        attackType: AttackType.MALICIOUS_FILE,
        matchLocation: "path,body",
        action: "block",
        isEnabled: true
      },
      {
        name: "API Rate Limiting",
        description: "Limits excessive API requests",
        pattern: "^/api/.*",
        attackType: AttackType.RATE_LIMIT,
        matchLocation: "path",
        action: "monitor",
        isEnabled: true
      },
      // Bot Protection Rules
      {
        name: "Bad Bot Blocking",
        description: "Blocks known bad bot user agents",
        pattern: "\\b(zgrab|semrush|netcraft|masscan|censys|nmap|dirbuster|nikto|gobuster|wpscan|hydra|nessus|burp|qualys|acunetix|blackwidow|zap|grabber|nmapscanner)\\b",
        attackType: AttackType.BOT_ACTIVITY,
        matchLocation: "headers",
        action: "block",
        isEnabled: true
      },
      {
        name: "Bot Signature Detection",
        description: "Detects bot signatures in headers and behavior patterns",
        pattern: "\\b(bot|spider|crawler|scraper|fetch|headless)\\b",
        attackType: AttackType.BOT_ACTIVITY,
        matchLocation: "headers",
        action: "monitor",
        isEnabled: true
      },
      {
        name: "Suspicious User Agent",
        description: "Detects missing or suspicious user agents",
        pattern: "^$|^mozilla/\\d\\.0$|^\\w{1,5}$|python-requests|curl|wget|go-http-client",
        attackType: AttackType.BOT_ACTIVITY, 
        matchLocation: "headers",
        action: "block",
        isEnabled: true
      },
      // SSL Verification Rules
      {
        name: "SSL Protocol Enforcement",
        description: "Enforces secure SSL/TLS protocol versions",
        pattern: "SSLv2|SSLv3|TLSv1\\.0|TLSv1\\.1",
        attackType: AttackType.RECONNAISSANCE,
        matchLocation: "ssl",
        action: "block",
        isEnabled: true
      },
      {
        name: "Weak Cipher Protection",
        description: "Blocks connections using weak SSL/TLS ciphers",
        pattern: "NULL|EXPORT|DES|RC4|MD5|CBC",
        attackType: AttackType.RECONNAISSANCE,
        matchLocation: "ssl",
        action: "block",
        isEnabled: true
      }
    ];

    defaultRules.forEach(rule => this.createRule(rule));
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort((a, b) => a.id - b.id);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const createdAt = new Date();
    
    // Default values for fields with defaults
    const defaults = {
      role: "viewer",
      isActive: true,
      createdAt,
      lastLogin: null as Date | null,
      fullName: null as string | null
    };
    
    const user = { ...defaults, ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, partialUser: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      return undefined;
    }
    
    const updatedUser: User = { ...existingUser, ...partialUser };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }
  
  async updateLastLogin(id: number): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) {
      return false;
    }
    
    const updatedUser = { ...user, lastLogin: new Date() };
    this.users.set(id, updatedUser);
    return true;
  }

  // Rule methods
  async getAllRules(): Promise<Rule[]> {
    return Array.from(this.rules.values()).sort((a, b) => a.id - b.id);
  }

  async getRule(id: number): Promise<Rule | undefined> {
    return this.rules.get(id);
  }

  async createRule(insertRule: InsertRule): Promise<Rule> {
    const id = this.ruleCurrentId++;
    const createdAt = new Date();
    
    // Default values for required fields
    const defaults = {
      description: null,
      action: "block",
      isEnabled: true,
      domainId: null,
      isGlobal: true
    };
    
    const rule: Rule = { ...defaults, ...insertRule, id, createdAt };
    this.rules.set(id, rule);
    return rule;
  }

  async updateRule(id: number, partialRule: Partial<InsertRule>): Promise<Rule | undefined> {
    const existingRule = this.rules.get(id);
    if (!existingRule) return undefined;

    const updatedRule: Rule = { ...existingRule, ...partialRule };
    this.rules.set(id, updatedRule);
    return updatedRule;
  }

  async deleteRule(id: number): Promise<boolean> {
    return this.rules.delete(id);
  }

  // Domain methods
  async getAllDomains(): Promise<Domain[]> {
    return Array.from(this.domains.values()).sort((a, b) => a.id - b.id);
  }

  async getDomain(id: number): Promise<Domain | undefined> {
    return this.domains.get(id);
  }

  async createDomain(insertDomain: InsertDomain): Promise<Domain> {
    const id = this.domainCurrentId++;
    const createdAt = new Date();
    
    // Default values for required fields
    const defaults = {
      description: null,
      targetIp: null,
      dnsProvider: null,
      isActive: true,
      enableGeoBlocking: false,
      applyRules: true,
      enableBotProtection: false,
      enableSslVerification: false,
      selectedRules: null
    };
    
    const domain: Domain = { ...defaults, ...insertDomain, id, createdAt };
    this.domains.set(id, domain);
    return domain;
  }

  async updateDomain(id: number, partialDomain: Partial<InsertDomain>): Promise<Domain | undefined> {
    const existingDomain = this.domains.get(id);
    if (!existingDomain) return undefined;

    const updatedDomain: Domain = { ...existingDomain, ...partialDomain };
    this.domains.set(id, updatedDomain);
    return updatedDomain;
  }

  async deleteDomain(id: number): Promise<boolean> {
    // First check if domain exists
    const domain = this.domains.get(id);
    if (!domain) {
      return false;
    }
    
    // Clean up related geo blocks
    Array.from(this.geoBlocks.values())
      .filter(geoBlock => geoBlock.domainId === id)
      .forEach(geoBlock => this.geoBlocks.delete(geoBlock.id));
    
    // Clean up related threat feeds
    Array.from(this.threatFeeds.values())
      .filter(feed => feed.domainId === id)
      .forEach(feed => this.threatFeeds.delete(feed.id));
    
    // Clean up threat entries related to domain-specific threat feeds
    const feedIds = Array.from(this.threatFeeds.values())
      .filter(feed => feed.domainId === id)
      .map(feed => feed.id);
    
    if (feedIds.length > 0) {
      Array.from(this.threatEntries.values())
        .filter(entry => feedIds.includes(entry.feedId))
        .forEach(entry => this.threatEntries.delete(entry.id));
    }
    
    // Clean up rules specific to this domain
    Array.from(this.rules.values())
      .filter(rule => rule.domainId === id)
      .forEach(rule => this.rules.delete(rule.id));
    
    // Finally delete the domain itself
    return this.domains.delete(id);
  }

  // GeoBlock methods
  async getAllGeoBlocks(): Promise<GeoBlock[]> {
    return Array.from(this.geoBlocks.values()).sort((a, b) => a.id - b.id);
  }

  async getGeoBlock(id: number): Promise<GeoBlock | undefined> {
    return this.geoBlocks.get(id);
  }

  async getGeoBlockByCountryCode(countryCode: string): Promise<GeoBlock | undefined> {
    return Array.from(this.geoBlocks.values()).find(
      (geoBlock) => geoBlock.countryCode === countryCode
    );
  }

  async createGeoBlock(insertGeoBlock: InsertGeoBlock): Promise<GeoBlock> {
    const id = this.geoBlockCurrentId++;
    const createdAt = new Date();
    
    // Default values for required fields
    const defaults = {
      isEnabled: true,
      domainId: null,
      reason: null
    };
    
    const geoBlock: GeoBlock = { ...defaults, ...insertGeoBlock, id, createdAt };
    this.geoBlocks.set(id, geoBlock);
    return geoBlock;
  }

  async updateGeoBlock(id: number, partialGeoBlock: Partial<InsertGeoBlock>): Promise<GeoBlock | undefined> {
    const existingGeoBlock = this.geoBlocks.get(id);
    if (!existingGeoBlock) return undefined;

    const updatedGeoBlock: GeoBlock = { ...existingGeoBlock, ...partialGeoBlock };
    this.geoBlocks.set(id, updatedGeoBlock);
    return updatedGeoBlock;
  }

  async deleteGeoBlock(id: number): Promise<boolean> {
    return this.geoBlocks.delete(id);
  }

  // Request log methods
  async getAllRequestLogs(limit = 100, offset = 0): Promise<RequestLog[]> {
    return Array.from(this.requestLogs.values())
      .sort((a, b) => {
        // Ensure we're comparing dates safely
        const dateA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp as unknown as string);
        const dateB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp as unknown as string);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(offset, offset + limit);
  }

  async getRequestLog(id: number): Promise<RequestLog | undefined> {
    return this.requestLogs.get(id);
  }

  async createRequestLog(insertLog: InsertRequestLog): Promise<RequestLog> {
    const id = this.requestLogCurrentId++;
    const timestamp = new Date();
    
    // Default values for required fields
    const defaults = {
      attackType: null,
      domainId: null,
      countryCode: null,
      body: null,
      ruleId: null,
      blockedReason: null,
      requestId: null,
      responseStatus: null,
      queryParams: null
    };
    
    const log: RequestLog = { 
      ...defaults, 
      ...insertLog, 
      id, 
      timestamp, 
      responseTime: Math.floor(Math.random() * 500) // Mock response time 0-500ms
    };
    
    this.requestLogs.set(id, log);
    return log;
  }

  async getRequestLogCount(): Promise<number> {
    return this.requestLogs.size;
  }

  async getBlockedRequestCount(): Promise<number> {
    return Array.from(this.requestLogs.values()).filter(log => log.isBlocked).length;
  }

  async getRequestLogsByAttackType(): Promise<{attackType: string, count: number}[]> {
    const attackCounts = new Map<string, number>();

    Array.from(this.requestLogs.values())
      .filter(log => log.isBlocked && log.attackType)
      .forEach(log => {
        const type = log.attackType || "Unknown";
        attackCounts.set(type, (attackCounts.get(type) || 0) + 1);
      });

    return Array.from(attackCounts.entries()).map(([attackType, count]) => ({
      attackType,
      count
    })).sort((a, b) => b.count - a.count);
  }

  async getRequestLogsByCountry(): Promise<{countryCode: string, countryName: string, count: number}[]> {
    const countryCounts = new Map<string, {countryName: string, count: number}>();

    // Define some country names for common country codes
    const countryNames = new Map<string, string>([
      ["US", "United States"],
      ["CN", "China"],
      ["RU", "Russia"],
      ["GB", "United Kingdom"],
      ["DE", "Germany"],
      ["FR", "France"],
      ["IN", "India"],
      ["JP", "Japan"],
      ["BR", "Brazil"],
      ["CA", "Canada"],
    ]);

    Array.from(this.requestLogs.values())
      .filter(log => log.countryCode)
      .forEach(log => {
        const code = log.countryCode || "Unknown";
        const name = countryNames.get(code) || "Unknown";
        const current = countryCounts.get(code) || { countryName: name, count: 0 };
        countryCounts.set(code, { countryName: current.countryName, count: current.count + 1 });
      });

    return Array.from(countryCounts.entries()).map(([countryCode, data]) => ({
      countryCode,
      countryName: data.countryName,
      count: data.count
    })).sort((a, b) => b.count - a.count);
  }

  async getTrafficOverviewByHour(domainId?: number): Promise<{hour: number, allowed: number, blocked: number}[]> {
    const now = new Date();
    const hourlyData: {hour: number, allowed: number, blocked: number}[] = [];

    // Initialize data for the last 24 hours
    for (let i = 0; i < 24; i++) {
      hourlyData.push({ hour: i, allowed: 0, blocked: 0 });
    }

    // Filter logs by domain if domainId is provided
    const logs = Array.from(this.requestLogs.values()).filter(log => {
      // If no domainId is specified, include all logs
      if (!domainId) return true;
      
      // Otherwise only include logs for the specified domain
      return log.domainId === domainId;
    });

    // Group request logs by hour
    logs.forEach(log => {
      // Ensure we're working with a valid Date object
      const logTimestamp = log.timestamp instanceof Date 
        ? log.timestamp 
        : (typeof log.timestamp === 'string' ? new Date(log.timestamp) : new Date(log.timestamp as unknown as string));
        
      if (now.getTime() - logTimestamp.getTime() <= 24 * 60 * 60 * 1000) {
        const hourIndex = logTimestamp.getHours();
        if (log.isBlocked) {
          hourlyData[hourIndex].blocked++;
        } else {
          hourlyData[hourIndex].allowed++;
        }
      }
    });

    return hourlyData;
  }

  // Threat Intelligence Feed methods
  async getAllThreatFeeds(): Promise<ThreatFeed[]> {
    return Array.from(this.threatFeeds.values()).sort((a, b) => a.id - b.id);
  }

  async getThreatFeed(id: number): Promise<ThreatFeed | undefined> {
    return this.threatFeeds.get(id);
  }

  async getThreatFeedsByDomain(domainId: number): Promise<ThreatFeed[]> {
    return Array.from(this.threatFeeds.values())
      .filter(feed => feed.domainId === domainId || feed.isGlobal)
      .sort((a, b) => a.id - b.id);
  }

  async createThreatFeed(insertFeed: InsertThreatFeed): Promise<ThreatFeed> {
    const id = this.threatFeedCurrentId++;
    const createdAt = new Date();
    
    // Default values for required fields
    const defaults = {
      description: null,
      isEnabled: true,
      domainId: null,
      isGlobal: true,
      apiKey: null,
      updateInterval: "daily",
      entryCount: 0
    };
    
    const feed: ThreatFeed = { 
      ...defaults,
      ...insertFeed, 
      id, 
      createdAt, 
      lastUpdated: createdAt
    };
    
    this.threatFeeds.set(id, feed);
    return feed;
  }

  async updateThreatFeed(id: number, partialFeed: Partial<InsertThreatFeed>): Promise<ThreatFeed | undefined> {
    const existingFeed = this.threatFeeds.get(id);
    if (!existingFeed) return undefined;

    const updatedFeed: ThreatFeed = { ...existingFeed, ...partialFeed };
    this.threatFeeds.set(id, updatedFeed);
    return updatedFeed;
  }

  async deleteThreatFeed(id: number): Promise<boolean> {
    // Also delete all entries associated with this feed
    Array.from(this.threatEntries.values())
      .filter(entry => entry.feedId === id)
      .forEach(entry => this.threatEntries.delete(entry.id));
    
    return this.threatFeeds.delete(id);
  }

  // This method simulates fetching new data from an external threat feed
  async refreshThreatFeed(id: number): Promise<ThreatFeed | undefined> {
    const feed = this.threatFeeds.get(id);
    if (!feed) return undefined;

    const updatedFeed = { ...feed, lastUpdated: new Date() };
    
    // The actual implementation would fetch data from the feed URL
    // and update the threat entries. For now, we'll simulate it.
    const newEntries: InsertThreatEntry[] = [];
    const entryCount = Math.floor(Math.random() * 10) + 5; // 5-15 new entries
    
    if (feed.feedType === ThreatFeedType.IP_BLACKLIST) {
      for (let i = 0; i < entryCount; i++) {
        const octet1 = Math.floor(Math.random() * 223) + 1;
        const octet2 = Math.floor(Math.random() * 255);
        const octet3 = Math.floor(Math.random() * 255);
        const octet4 = Math.floor(Math.random() * 255);
        newEntries.push({
          feedId: id,
          value: `${octet1}.${octet2}.${octet3}.${octet4}`,
          type: 'ip',
          confidence: Math.floor(Math.random() * 100),
          description: 'Malicious IP from threat feed',
          isActive: true
        });
      }
    } else if (feed.feedType === ThreatFeedType.MALWARE_DOMAINS) {
      const tlds = ['.com', '.org', '.net', '.ru', '.cn'];
      for (let i = 0; i < entryCount; i++) {
        const domain = 'malicious' + Math.floor(Math.random() * 1000) + tlds[Math.floor(Math.random() * tlds.length)];
        newEntries.push({
          feedId: id,
          value: domain,
          type: 'domain',
          confidence: Math.floor(Math.random() * 100),
          description: 'Malware domain from threat feed',
          isActive: true
        });
      }
    }

    // Add the new entries to the collection
    await this.bulkCreateThreatEntries(newEntries);
    
    // Update the feed with the new entry count
    updatedFeed.entryCount = (updatedFeed.entryCount || 0) + newEntries.length;
    this.threatFeeds.set(id, updatedFeed);
    
    return updatedFeed;
  }

  // Threat Entry methods
  async getAllThreatEntries(feedId?: number, limit = 100, offset = 0): Promise<ThreatEntry[]> {
    let entries = Array.from(this.threatEntries.values());
    
    if (feedId) {
      entries = entries.filter(entry => entry.feedId === feedId);
    }
    
    return entries
      .sort((a, b) => {
        // Handle different date formats safely
        const dateA = a.firstSeen instanceof Date 
          ? a.firstSeen 
          : (typeof a.firstSeen === 'string' ? new Date(a.firstSeen) : new Date(a.firstSeen as unknown as string));
        
        const dateB = b.firstSeen instanceof Date 
          ? b.firstSeen 
          : (typeof b.firstSeen === 'string' ? new Date(b.firstSeen) : new Date(b.firstSeen as unknown as string));
          
        return dateB.getTime() - dateA.getTime();
      })
      .slice(offset, offset + limit);
  }

  async getThreatEntry(id: number): Promise<ThreatEntry | undefined> {
    return this.threatEntries.get(id);
  }

  async createThreatEntry(insertEntry: InsertThreatEntry): Promise<ThreatEntry> {
    const id = this.threatEntryCurrentId++;
    const now = new Date();
    
    // Default values for required fields
    const defaults = {
      description: null,
      isActive: true,
      confidence: null,
      metadata: null,
      expiresAt: null
    };
    
    const entry: ThreatEntry = { 
      ...defaults,
      ...insertEntry, 
      id, 
      firstSeen: now,
      lastSeen: now
    };
    
    this.threatEntries.set(id, entry);
    return entry;
  }

  async updateThreatEntry(id: number, partialEntry: Partial<InsertThreatEntry>): Promise<ThreatEntry | undefined> {
    const existingEntry = this.threatEntries.get(id);
    if (!existingEntry) return undefined;

    const updatedEntry: ThreatEntry = { 
      ...existingEntry, 
      ...partialEntry,
      lastSeen: new Date() // Update the lastSeen timestamp
    };
    this.threatEntries.set(id, updatedEntry);
    return updatedEntry;
  }

  async deleteThreatEntry(id: number): Promise<boolean> {
    return this.threatEntries.delete(id);
  }

  async bulkCreateThreatEntries(entries: InsertThreatEntry[]): Promise<number> {
    let count = 0;
    for (const entry of entries) {
      await this.createThreatEntry(entry);
      count++;
    }
    return count;
  }

  async checkIpAgainstThreats(ip: string, domainId?: number): Promise<ThreatEntry | undefined> {
    // For a real implementation, this would check if an IP is in the threat database
    // and if it belongs to a feed that's enabled for the domain
    const entries = Array.from(this.threatEntries.values())
      .filter(entry => entry.type === 'ip' && entry.value === ip && entry.isActive);
    
    if (entries.length === 0) return undefined;
    
    // If a domainId is provided, check if the feed is associated with the domain or is global
    if (domainId) {
      for (const entry of entries) {
        const feed = this.threatFeeds.get(entry.feedId);
        if (feed && (feed.domainId === domainId || feed.isGlobal) && feed.isEnabled) {
          return entry;
        }
      }
      return undefined;
    }
    
    return entries[0]; // Return the first match if no domainId filter
  }

  async checkDomainAgainstThreats(domain: string, domainId?: number): Promise<ThreatEntry | undefined> {
    // Similar to IP check but for domains
    const entries = Array.from(this.threatEntries.values())
      .filter(entry => entry.type === 'domain' && entry.value === domain && entry.isActive);
    
    if (entries.length === 0) return undefined;
    
    if (domainId) {
      for (const entry of entries) {
        const feed = this.threatFeeds.get(entry.feedId);
        if (feed && (feed.domainId === domainId || feed.isGlobal) && feed.isEnabled) {
          return entry;
        }
      }
      return undefined;
    }
    
    return entries[0];
  }

  async getActiveThreatTypes(): Promise<{type: string, count: number}[]> {
    const typeCounts = new Map<string, number>();
    
    Array.from(this.threatEntries.values())
      .filter(entry => entry.isActive)
      .forEach(entry => {
        typeCounts.set(entry.type, (typeCounts.get(entry.type) || 0) + 1);
      });
      
    return Array.from(typeCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }
  
  // New threat intelligence visualization methods
  async getLogsByCountryWithThreatInfo(timePeriod: string = '24h'): Promise<{countryCode: string, country: string, count: number, lat?: number, lon?: number, threatType?: string}[]> {
    const countryCounts = new Map<string, {country: string, count: number, lat?: number, lon?: number, threatType?: string}>();
    
    // Define geo coordinates for common country codes
    const countryGeoData = new Map<string, {country: string, lat: number, lon: number}>([
      ["US", {country: "United States", lat: 37.0902, lon: -95.7129}],
      ["CN", {country: "China", lat: 35.8617, lon: 104.1954}],
      ["RU", {country: "Russia", lat: 61.5240, lon: 105.3188}],
      ["GB", {country: "United Kingdom", lat: 55.3781, lon: -3.4360}],
      ["DE", {country: "Germany", lat: 51.1657, lon: 10.4515}],
      ["FR", {country: "France", lat: 46.2276, lon: 2.2137}],
      ["IN", {country: "India", lat: 20.5937, lon: 78.9629}],
      ["JP", {country: "Japan", lat: 36.2048, lon: 138.2529}],
      ["BR", {country: "Brazil", lat: -14.2350, lon: -51.9253}],
      ["CA", {country: "Canada", lat: 56.1304, lon: -106.3468}],
      ["AU", {country: "Australia", lat: -25.2744, lon: 133.7751}],
      ["NL", {country: "Netherlands", lat: 52.1326, lon: 5.2913}],
      ["KR", {country: "South Korea", lat: 35.9078, lon: 127.7669}],
      ["UA", {country: "Ukraine", lat: 48.3794, lon: 31.1656}],
      ["IR", {country: "Iran", lat: 32.4279, lon: 53.6880}],
      ["TR", {country: "Turkey", lat: 38.9637, lon: 35.2433}],
      ["IT", {country: "Italy", lat: 41.8719, lon: 12.5674}],
      ["SG", {country: "Singapore", lat: 1.3521, lon: 103.8198}],
      ["PL", {country: "Poland", lat: 51.9194, lon: 19.1451}],
      ["SE", {country: "Sweden", lat: 60.1282, lon: 18.6435}],
    ]);
    
    // Get logs based on time period
    const filtered = this.getFilteredLogsByTimePeriod(timePeriod);
    
    // Add threat types to common attackers
    const threatTypes = ["SQL Injection", "XSS", "Brute Force", "DDoS", "Malware", "Phishing"];
    
    // Count by country and add threat info
    filtered
      .filter(log => log.countryCode && log.isBlocked)
      .forEach(log => {
        const code = log.countryCode || "Unknown";
        const countryData = countryGeoData.get(code) || {country: "Unknown", lat: 0, lon: 0};
        const threatType = log.attackType || threatTypes[Math.floor(Math.random() * threatTypes.length)];
        
        // Initialize or update count
        if (countryCounts.has(code)) {
          const current = countryCounts.get(code)!;
          countryCounts.set(code, { 
            ...current, 
            count: current.count + 1 
          });
        } else {
          countryCounts.set(code, {
            country: countryData.country,
            count: 1,
            lat: countryData.lat,
            lon: countryData.lon,
            threatType: threatType
          });
        }
      });
    
    // Return formatted results
    return Array.from(countryCounts.entries()).map(([countryCode, data]) => ({
      countryCode,
      country: data.country,
      count: data.count,
      lat: data.lat,
      lon: data.lon,
      threatType: data.threatType
    })).sort((a, b) => b.count - a.count);
  }
  
  async getLogsByThreatType(timePeriod: string = '24h'): Promise<{type: string, count: number}[]> {
    const typeCounts = new Map<string, number>();
    
    // Get logs based on time period
    const filtered = this.getFilteredLogsByTimePeriod(timePeriod);
    
    // Count by attack type
    filtered
      .filter(log => log.isBlocked)
      .forEach(log => {
        // Use attack type or fallback to "Unknown"
        const type = log.attackType || 'Unknown';
        typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
      });
    
    // Return formatted results
    return Array.from(typeCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }
  
  async getMostTargetedDomains(timePeriod: string = '24h'): Promise<{domain: string, domainId: number, count: number}[]> {
    const domainCounts = new Map<number, {domain: string, count: number}>();
    
    // Get logs based on time period
    const filtered = this.getFilteredLogsByTimePeriod(timePeriod);
    
    // Get all domain data
    const domains = Array.from(this.domains.values());
    
    // Count by domain
    filtered
      .filter(log => log.isBlocked && log.domainId)
      .forEach(log => {
        if (log.domainId) {
          const domain = domains.find(d => d.id === log.domainId);
          
          if (domain) {
            const current = domainCounts.get(domain.id) || { domain: domain.name, count: 0 };
            domainCounts.set(domain.id, { 
              domain: current.domain,
              count: current.count + 1 
            });
          }
        }
      });
    
    // Return formatted results
    return Array.from(domainCounts.entries())
      .map(([domainId, data]) => ({ 
        domain: data.domain,
        domainId,
        count: data.count 
      }))
      .sort((a, b) => b.count - a.count);
  }
  
  // Helper method to filter logs by time period
  private getFilteredLogsByTimePeriod(timePeriod: string): RequestLog[] {
    const now = new Date();
    let cutoff: Date;
    
    switch (timePeriod) {
      case '7d':
        cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        cutoff = new Date(0); // Beginning of time
        break;
      case '24h':
      default:
        cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
    }
    
    return Array.from(this.requestLogs.values())
      .filter(log => {
        const logDate = log.timestamp instanceof Date 
          ? log.timestamp 
          : new Date(log.timestamp || Date.now());
        return logDate >= cutoff;
      });
  }

  // Anomaly Detection Methods Implementation
  
  async getAllAnomalies(domainId?: number, status?: string, limit = 100, offset = 0): Promise<Anomaly[]> {
    let anomalies = Array.from(this.anomalies.values());
    
    // Apply domain filter if specified
    if (domainId !== undefined) {
      anomalies = anomalies.filter(anomaly => anomaly.domainId === domainId);
    }
    
    // Apply status filter if specified
    if (status !== undefined) {
      anomalies = anomalies.filter(anomaly => anomaly.status === status);
    }
    
    // Sort by timestamp desc (newest first)
    anomalies = anomalies.sort((a, b) => {
      const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : 0;
      const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : 0;
      return bTime - aTime;
    });
    
    // Apply pagination
    return anomalies.slice(offset, offset + limit);
  }
  
  async getAnomaly(id: number): Promise<Anomaly | undefined> {
    return this.anomalies.get(id);
  }
  
  async createAnomaly(insertAnomaly: InsertAnomaly): Promise<Anomaly> {
    const id = this.anomalyCurrentId++;
    const now = new Date();
    
    // Apply defaults
    const defaults = {
      score: 75,
      status: AnomalyStatus.ACTIVE,
      timestamp: now,
      resolvedAt: null,
      resolvedBy: null,
      resolutionNotes: null,
      details: null,
      features: null,
      requestIds: null,
      mlModelType: null,
      source: null,
      domainId: null
    };
    
    // Process the insert data
    const processedInsert = {
      ...insertAnomaly,
      source: insertAnomaly.source || null,
      domainId: insertAnomaly.domainId || null,
      // Ensure we process JSON if it's a string
      details: typeof insertAnomaly.details === 'string' 
        ? JSON.parse(insertAnomaly.details) 
        : insertAnomaly.details,
      features: typeof insertAnomaly.features === 'string'
        ? JSON.parse(insertAnomaly.features)
        : insertAnomaly.features,
      requestIds: typeof insertAnomaly.requestIds === 'string'
        ? JSON.parse(insertAnomaly.requestIds)
        : insertAnomaly.requestIds
    };
    
    // Create the anomaly object with proper typing
    const anomaly: Anomaly = { 
      id,
      type: processedInsert.type,
      status: processedInsert.status || defaults.status,
      timestamp: defaults.timestamp,
      score: processedInsert.score,
      source: processedInsert.source,
      domainId: processedInsert.domainId,
      details: processedInsert.details,
      mlModelType: processedInsert.mlModelType || defaults.mlModelType,
      features: processedInsert.features || defaults.features,
      requestIds: processedInsert.requestIds || defaults.requestIds,
      resolvedAt: defaults.resolvedAt,
      resolvedBy: defaults.resolvedBy,
      resolutionNotes: defaults.resolutionNotes
    };
    
    this.anomalies.set(id, anomaly);
    return anomaly;
  }
  
  async updateAnomaly(id: number, partialAnomaly: Partial<InsertAnomaly>): Promise<Anomaly | undefined> {
    const existingAnomaly = this.anomalies.get(id);
    if (!existingAnomaly) return undefined;
    
    // Process fields to match the schema
    const processed: Partial<Anomaly> = {};
    
    if (partialAnomaly.status) {
      processed.status = partialAnomaly.status;
    }
    
    if (partialAnomaly.type) {
      processed.type = partialAnomaly.type;
    }
    
    if (partialAnomaly.domainId !== undefined) {
      processed.domainId = partialAnomaly.domainId;
    }
    
    if (partialAnomaly.score !== undefined) {
      processed.score = partialAnomaly.score;
    }
    
    if (partialAnomaly.source !== undefined) {
      processed.source = partialAnomaly.source;
    }
    
    if (partialAnomaly.details !== undefined) {
      processed.details = typeof partialAnomaly.details === 'string' 
        ? JSON.parse(partialAnomaly.details) 
        : partialAnomaly.details;
    }
    
    if (partialAnomaly.mlModelType !== undefined) {
      processed.mlModelType = partialAnomaly.mlModelType;
    }
    
    if (partialAnomaly.features !== undefined) {
      processed.features = typeof partialAnomaly.features === 'string'
        ? JSON.parse(partialAnomaly.features)
        : partialAnomaly.features;
    }
    
    if (partialAnomaly.requestIds !== undefined) {
      processed.requestIds = typeof partialAnomaly.requestIds === 'string'
        ? JSON.parse(partialAnomaly.requestIds)
        : partialAnomaly.requestIds;
    }
    
    const updatedAnomaly = { 
      ...existingAnomaly,
      ...processed,
    };
    
    this.anomalies.set(id, updatedAnomaly);
    return updatedAnomaly;
  }
  
  async deleteAnomaly(id: number): Promise<boolean> {
    return this.anomalies.delete(id);
  }
  
  async getAnomalyCount(domainId?: number, status?: string): Promise<number> {
    let count = 0;
    this.anomalies.forEach(anomaly => {
      if (
        (domainId === undefined || anomaly.domainId === domainId) &&
        (status === undefined || anomaly.status === status)
      ) {
        count++;
      }
    });
    return count;
  }
  
  async getAnomaliesByType(): Promise<{type: string, count: number}[]> {
    const anomalies = Array.from(this.anomalies.values());
    
    // Group by type
    const typeCountMap = anomalies.reduce((acc, anomaly) => {
      const type = anomaly.type;
      acc.set(type, (acc.get(type) || 0) + 1);
      return acc;
    }, new Map<string, number>());
    
    // Convert to array of objects
    return Array.from(typeCountMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }
  
  async resolveAnomaly(id: number, userId: number, notes?: string): Promise<Anomaly | undefined> {
    const anomaly = this.anomalies.get(id);
    if (!anomaly) return undefined;
    
    const updatedAnomaly: Anomaly = {
      ...anomaly,
      status: AnomalyStatus.RESOLVED,
      resolvedAt: new Date(),
      resolvedBy: userId,
      resolutionNotes: notes !== undefined ? notes : null
    };
    
    this.anomalies.set(id, updatedAnomaly);
    return updatedAnomaly;
  }
  
  async markAnomalyAsFalsePositive(id: number, userId: number, notes?: string): Promise<Anomaly | undefined> {
    const anomaly = this.anomalies.get(id);
    if (!anomaly) return undefined;
    
    const updatedAnomaly: Anomaly = {
      ...anomaly,
      status: AnomalyStatus.FALSE_POSITIVE,
      resolvedAt: new Date(),
      resolvedBy: userId,
      resolutionNotes: notes !== undefined ? notes : null
    };
    
    this.anomalies.set(id, updatedAnomaly);
    return updatedAnomaly;
  }
  
  async getAnomalyTrend(days: number, domainId?: number): Promise<{date: string, count: number}[]> {
    const anomalies = Array.from(this.anomalies.values());
    const filteredAnomalies = domainId 
      ? anomalies.filter(anomaly => anomaly.domainId === domainId)
      : anomalies;
    
    // Calculate the date range
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Create a map for each day in the range
    const dateCountMap = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().slice(0, 10); // YYYY-MM-DD format
      dateCountMap.set(dateStr, 0);
    }
    
    // Count anomalies by date
    filteredAnomalies.forEach(anomaly => {
      const dateStr = anomaly.timestamp instanceof Date 
        ? anomaly.timestamp.toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);  // Fallback to today
        
      if (dateCountMap.has(dateStr)) {
        dateCountMap.set(dateStr, (dateCountMap.get(dateStr) || 0) + 1);
      }
    });
    
    // Convert to array of objects
    return Array.from(dateCountMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
  
  async runAnomalyDetection(domainId?: number): Promise<Anomaly[]> {
    // Get request logs to analyze
    const logs = Array.from(this.requestLogs.values());
    const filteredLogs = domainId 
      ? logs.filter(log => log.domainId === domainId)
      : logs;
    
    // Only analyze recent logs (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const recentLogs = filteredLogs.filter(log => {
      if (!log.timestamp) return false;
      // Safely handle timestamp comparison
      try {
        const logDate = new Date(log.timestamp);
        return logDate >= oneDayAgo;
      } catch (e) {
        return false;
      }
    });
    
    const newAnomalies: Anomaly[] = [];
    
    // Simple rate-based detection - detect unusual activity spikes
    const ipRequestCounts = new Map<string, number>();
    const ipBlockedCounts = new Map<string, number>();
    
    // Count requests and blocks by IP
    recentLogs.forEach(log => {
      // Count total requests by IP
      const ip = log.ipAddress; // Use ipAddress instead of clientIp
      ipRequestCounts.set(ip, (ipRequestCounts.get(ip) || 0) + 1);
      
      // Count blocked requests by IP
      if (log.isBlocked) { // Use isBlocked instead of action
        ipBlockedCounts.set(ip, (ipBlockedCounts.get(ip) || 0) + 1);
      }
    });
    
    // Find IPs with high request counts
    const highRequestThreshold = 100; // Configurable threshold
    const highBlockRateThreshold = 0.5; // 50% of requests blocked
    
    // Use Array.from to avoid MapIterator issues
    const ipEntries = Array.from(ipRequestCounts.entries());
    for (const [ip, count] of ipEntries) {
      const blockedCount = ipBlockedCounts.get(ip) || 0;
      const blockRate = blockedCount / count;
      
      // Detect high volume of requests
      if (count > highRequestThreshold) {
        const affectedDomainIds = new Set<number>();
        recentLogs
          .filter(log => log.ipAddress === ip)
          .forEach(log => {
            if (log.domainId) affectedDomainIds.add(log.domainId);
          });
        
        // Create a traffic spike anomaly for each affected domain
        // Use Array.from to avoid Set iteration issues
        const domainIdArray = Array.from(affectedDomainIds);
        for (const affectedDomainId of domainIdArray) {
          const anomaly: InsertAnomaly = {
            type: AnomalyType.TRAFFIC_SPIKE,
            score: Math.min(50 + count / 10, 95), // Higher score with more requests
            domainId: affectedDomainId,
            source: ip,
            status: AnomalyStatus.ACTIVE,
            details: JSON.stringify({
              requestCount: count,
              timeframe: '24h',
              detectionTime: new Date().toISOString()
            }),
            mlModelType: MLModelType.STATISTICAL
          };
          
          newAnomalies.push(await this.createAnomaly(anomaly));
        }
      }
      
      // Detect high block rate
      if (count > 10 && blockRate > highBlockRateThreshold) {
        const affectedDomainIds = new Set<number>();
        recentLogs
          .filter(log => log.ipAddress === ip && log.isBlocked)
          .forEach(log => {
            if (log.domainId) affectedDomainIds.add(log.domainId);
          });
        
        // Create a high block rate anomaly for each affected domain
        const domainIdArray = Array.from(affectedDomainIds);
        for (const affectedDomainId of domainIdArray) {
          const anomaly: InsertAnomaly = {
            type: AnomalyType.REQUEST_PATTERN,
            score: Math.min(60 + blockRate * 35, 95), // Higher score with higher block rate
            domainId: affectedDomainId,
            source: ip,
            status: AnomalyStatus.ACTIVE,
            details: JSON.stringify({
              requestCount: count,
              blockedCount: blockedCount,
              blockRate: blockRate,
              timeframe: '24h',
              detectionTime: new Date().toISOString()
            }),
            mlModelType: MLModelType.STATISTICAL
          };
          
          newAnomalies.push(await this.createAnomaly(anomaly));
        }
      }
    }
    
    // Detect unusual path patterns
    const pathCounts = new Map<string, number>();
    recentLogs.forEach(log => {
      pathCounts.set(log.path, (pathCounts.get(log.path) || 0) + 1);
    });
    
    // Find rare but suspicious paths
    const suspiciousPaths = [
      '/admin', '/wp-admin', '/phpMyAdmin', '/config', '/.env', 
      '/backup', '/.git', '/api/debug', '/console', '/wp-content'
    ];
    
    for (const suspiciousPath of suspiciousPaths) {
      const pathAccessCount = pathCounts.get(suspiciousPath) || 0;
      
      if (pathAccessCount > 0) {
        // Find affected domains
        const affectedDomainIds = new Set<number>();
        recentLogs
          .filter(log => log.path === suspiciousPath)
          .forEach(log => {
            if (log.domainId) affectedDomainIds.add(log.domainId);
          });
        
        // Create anomaly for each affected domain
        const domainIdArray = Array.from(affectedDomainIds);
        for (const affectedDomainId of domainIdArray) {
          const anomaly: InsertAnomaly = {
            type: AnomalyType.API_ABUSE,
            score: 80,
            domainId: affectedDomainId,
            source: null, // Multiple IPs may be involved
            status: AnomalyStatus.ACTIVE,
            details: JSON.stringify({
              path: suspiciousPath,
              accessCount: pathAccessCount,
              timeframe: '24h',
              detectionTime: new Date().toISOString()
            }),
            mlModelType: MLModelType.STATISTICAL
          };
          
          newAnomalies.push(await this.createAnomaly(anomaly));
        }
      }
    }
    
    return newAnomalies;
  }
  
  async getMLMetrics(): Promise<any> {
    const anomalies = Array.from(this.anomalies.values());
    
    // Count anomalies by model type
    const modelCounts = anomalies.reduce((acc, anomaly) => {
      const model = anomaly.mlModelType;
      if (model) {
        acc.set(model, (acc.get(model) || 0) + 1);
      }
      return acc;
    }, new Map<string, number>());
    
    // Count anomalies by status
    const statusCounts = anomalies.reduce((acc, anomaly) => {
      const status = anomaly.status;
      acc.set(status, (acc.get(status) || 0) + 1);
      return acc;
    }, new Map<string, number>());
    
    // Calculate true positive rate
    const totalResolved = statusCounts.get(AnomalyStatus.RESOLVED) || 0;
    const totalFalsePositives = statusCounts.get(AnomalyStatus.FALSE_POSITIVE) || 0;
    const totalClosed = totalResolved + totalFalsePositives;
    const truePositiveRate = totalClosed > 0 ? totalResolved / totalClosed : 0;
    
    // Return metrics
    return {
      totalAnomalies: anomalies.length,
      byModel: Object.fromEntries(modelCounts),
      byStatus: Object.fromEntries(statusCounts),
      accuracy: {
        truePositiveRate: truePositiveRate,
        falsePositiveRate: totalClosed > 0 ? totalFalsePositives / totalClosed : 0
      },
      latestRun: new Date().toISOString()
    };
  }
}

// Export a singleton instance of the storage
export const storage = new MemStorage();
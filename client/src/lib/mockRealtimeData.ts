/**
 * Mock Real-time Data Service
 * 
 * Provides simulated real-time data functionality when Firebase is not available or configured.
 * This file mimics the Firebase Realtime Database functionality for development purposes.
 */

type Callback<T> = (data: T) => void;
type Unsubscribe = () => void;

// Mock data stores
const requestLogs: any[] = [];
const attackAlerts: any[] = [];
const anomalies: any[] = [];
let dashboardStats: any = {};

// Mock timestamp generator
const serverTimestamp = () => new Date().toISOString();

// Subscription stores
const requestLogSubscriptions: Callback<any[]>[] = [];
const attackAlertSubscriptions: Callback<any[]>[] = [];
const anomalySubscriptions: Callback<any[]>[] = [];
const dashboardStatsSubscriptions: Callback<any>[] = [];

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

/**
 * Log a new request to the mock database
 */
export const logRequestToMock = async (requestData: any) => {
  try {
    const id = generateId();
    const newRequest = {
      id,
      ...requestData,
      timestamp: serverTimestamp()
    };
    
    requestLogs.unshift(newRequest);
    
    // Keep array at a reasonable size
    if (requestLogs.length > 500) {
      requestLogs.pop();
    }
    
    // Notify subscribers
    notifyRequestSubscribers();
    
    return id;
  } catch (error) {
    console.error('Error logging mock request:', error);
    return null;
  }
};

/**
 * Log a new attack alert to the mock database
 */
export const logAttackAlert = async (alertData: any) => {
  try {
    const id = generateId();
    const newAlert = {
      id,
      ...alertData,
      timestamp: serverTimestamp()
    };
    
    attackAlerts.unshift(newAlert);
    
    // Keep array at a reasonable size
    if (attackAlerts.length > 100) {
      attackAlerts.pop();
    }
    
    // Notify subscribers
    notifyAlertSubscribers();
    
    return id;
  } catch (error) {
    console.error('Error logging mock attack alert:', error);
    return null;
  }
};

/**
 * Update dashboard statistics in the mock database
 */
export const updateDashboardStats = async (stats: any) => {
  try {
    dashboardStats = {
      ...stats,
      lastUpdated: serverTimestamp()
    };
    
    // Notify subscribers
    notifyDashboardStatsSubscribers();
    
    return true;
  } catch (error) {
    console.error('Error updating mock dashboard stats:', error);
    return false;
  }
};

/**
 * Log an anomaly detection to the mock database
 */
export const logAnomaly = async (anomalyData: any) => {
  try {
    const id = generateId();
    const newAnomaly = {
      id,
      ...anomalyData,
      timestamp: serverTimestamp()
    };
    
    anomalies.unshift(newAnomaly);
    
    // Keep array at a reasonable size
    if (anomalies.length > 50) {
      anomalies.pop();
    }
    
    // Notify subscribers
    notifyAnomalySubscribers();
    
    return id;
  } catch (error) {
    console.error('Error logging mock anomaly:', error);
    return null;
  }
};

/**
 * Subscribe to recent request logs
 */
export const subscribeToRecentLogs = (callback: (logs: any[]) => void, limit = 100): Unsubscribe => {
  requestLogSubscriptions.push(callback);
  
  // Initial callback with current data
  const limitedLogs = requestLogs.slice(0, limit);
  callback(limitedLogs);
  
  // Return unsubscribe function
  return () => {
    const index = requestLogSubscriptions.indexOf(callback);
    if (index !== -1) {
      requestLogSubscriptions.splice(index, 1);
    }
  };
};

/**
 * Subscribe to attack alerts
 */
export const subscribeToAttackAlerts = (callback: (alerts: any[]) => void, limit = 20): Unsubscribe => {
  attackAlertSubscriptions.push(callback);
  
  // Initial callback with current data
  const limitedAlerts = attackAlerts.slice(0, limit);
  callback(limitedAlerts);
  
  // Return unsubscribe function
  return () => {
    const index = attackAlertSubscriptions.indexOf(callback);
    if (index !== -1) {
      attackAlertSubscriptions.splice(index, 1);
    }
  };
};

/**
 * Subscribe to dashboard statistics
 */
export const subscribeToDashboardStats = (callback: (stats: any) => void): Unsubscribe => {
  dashboardStatsSubscriptions.push(callback);
  
  // Initial callback with current data
  callback(dashboardStats);
  
  // Return unsubscribe function
  return () => {
    const index = dashboardStatsSubscriptions.indexOf(callback);
    if (index !== -1) {
      dashboardStatsSubscriptions.splice(index, 1);
    }
  };
};

/**
 * Subscribe to anomaly detections
 */
export const subscribeToAnomalies = (callback: (anomalies: any[]) => void, limit = 10): Unsubscribe => {
  anomalySubscriptions.push(callback);
  
  // Initial callback with current data
  const limitedAnomalies = anomalies.slice(0, limit);
  callback(limitedAnomalies);
  
  // Return unsubscribe function
  return () => {
    const index = anomalySubscriptions.indexOf(callback);
    if (index !== -1) {
      anomalySubscriptions.splice(index, 1);
    }
  };
};

// Helper functions to notify subscribers
function notifyRequestSubscribers() {
  requestLogSubscriptions.forEach(callback => {
    callback([...requestLogs]);
  });
}

function notifyAlertSubscribers() {
  attackAlertSubscriptions.forEach(callback => {
    callback([...attackAlerts]);
  });
}

function notifyDashboardStatsSubscribers() {
  dashboardStatsSubscriptions.forEach(callback => {
    callback({...dashboardStats});
  });
}

function notifyAnomalySubscribers() {
  anomalySubscriptions.forEach(callback => {
    callback([...anomalies]);
  });
}

// Initialize with some sample data
export const initializeMockData = () => {
  // Sample request logs
  for (let i = 0; i < 10; i++) {
    logRequestToMock({
      ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      method: ['GET', 'POST', 'PUT', 'DELETE'][Math.floor(Math.random() * 4)],
      path: ['/api/users', '/api/products', '/login', '/checkout'][Math.floor(Math.random() * 4)],
      blocked: Math.random() > 0.7,
      attackType: Math.random() > 0.7 ? ['SQL Injection', 'XSS', 'CSRF', 'Path Traversal'][Math.floor(Math.random() * 4)] : null,
      country: ['US', 'GB', 'FR', 'DE', 'RU', 'CN'][Math.floor(Math.random() * 6)]
    });
  }
  
  // Sample attack alerts
  for (let i = 0; i < 5; i++) {
    logAttackAlert({
      ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      attackType: ['SQL Injection', 'XSS', 'CSRF', 'Path Traversal'][Math.floor(Math.random() * 4)],
      severity: ['Low', 'Medium', 'High', 'Critical'][Math.floor(Math.random() * 4)],
      endpoint: ['/api/users', '/api/products', '/login', '/checkout'][Math.floor(Math.random() * 4)],
      country: ['US', 'GB', 'FR', 'DE', 'RU', 'CN'][Math.floor(Math.random() * 6)]
    });
  }
  
  // Sample dashboard stats
  updateDashboardStats({
    totalRequests: 1235,
    blockedRequests: 89,
    attacksByType: {
      'SQL Injection': 34,
      'XSS': 27,
      'CSRF': 14,
      'Path Traversal': 8,
      'Other': 6
    },
    topCountries: {
      'US': 456,
      'CN': 245,
      'RU': 122,
      'DE': 98,
      'GB': 87
    }
  });
  
  // Sample anomalies
  for (let i = 0; i < 3; i++) {
    logAnomaly({
      type: ['Traffic Spike', 'Pattern Change', 'New Attack Vector'][Math.floor(Math.random() * 3)],
      description: `Unusual activity detected from ${['US', 'CN', 'RU'][Math.floor(Math.random() * 3)]}`,
      confidence: Math.floor(Math.random() * 100),
      severity: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)]
    });
  }
  
  return true;
};

// Start simulating real-time updates
let simulationInterval: ReturnType<typeof setInterval> | null = null;

export const startMockDataSimulation = () => {
  if (simulationInterval) {
    clearInterval(simulationInterval);
  }
  
  simulationInterval = setInterval(() => {
    // Random chance to add new request
    if (Math.random() > 0.5) {
      logRequestToMock({
        ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        method: ['GET', 'POST', 'PUT', 'DELETE'][Math.floor(Math.random() * 4)],
        path: ['/api/users', '/api/products', '/login', '/checkout'][Math.floor(Math.random() * 4)],
        blocked: Math.random() > 0.7,
        attackType: Math.random() > 0.7 ? ['SQL Injection', 'XSS', 'CSRF', 'Path Traversal'][Math.floor(Math.random() * 4)] : null,
        country: ['US', 'GB', 'FR', 'DE', 'RU', 'CN'][Math.floor(Math.random() * 6)]
      });
    }
    
    // Random chance to add new attack alert
    if (Math.random() > 0.8) {
      logAttackAlert({
        ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        attackType: ['SQL Injection', 'XSS', 'CSRF', 'Path Traversal'][Math.floor(Math.random() * 4)],
        severity: ['Low', 'Medium', 'High', 'Critical'][Math.floor(Math.random() * 4)],
        endpoint: ['/api/users', '/api/products', '/login', '/checkout'][Math.floor(Math.random() * 4)],
        country: ['US', 'GB', 'FR', 'DE', 'RU', 'CN'][Math.floor(Math.random() * 6)]
      });
    }
    
    // Random chance to add new anomaly
    if (Math.random() > 0.9) {
      logAnomaly({
        type: ['Traffic Spike', 'Pattern Change', 'New Attack Vector'][Math.floor(Math.random() * 3)],
        description: `Unusual activity detected from ${['US', 'CN', 'RU'][Math.floor(Math.random() * 3)]}`,
        confidence: Math.floor(Math.random() * 100),
        severity: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)]
      });
    }
    
    // Update dashboard stats
    const currentStats = {...dashboardStats};
    if (currentStats.totalRequests) {
      updateDashboardStats({
        ...currentStats,
        totalRequests: currentStats.totalRequests + Math.floor(Math.random() * 5),
        blockedRequests: currentStats.blockedRequests + (Math.random() > 0.7 ? 1 : 0)
      });
    }
  }, 5000); // Update every 5 seconds
  
  return true;
};

export const stopMockDataSimulation = () => {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
  return true;
};
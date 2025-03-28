import { initializeApp } from 'firebase/app';
import { 
  getDatabase, 
  ref, 
  set, 
  onValue, 
  push, 
  query, 
  limitToLast, 
  serverTimestamp,
  onDisconnect,
  goOnline,
  goOffline,
  connectDatabaseEmulator
} from 'firebase/database';
import type { Database, DatabaseReference } from 'firebase/database';
import { apiRequest } from '@/lib/queryClient';
import * as mockService from './mockRealtimeData';

// Default empty Firebase configuration
let firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
  databaseURL: '',
};

// Firebase instances
let app: any;
let database: Database;
let requestLogsRef: DatabaseReference;
let attackAlertsRef: DatabaseReference;
let threatIntelRef: DatabaseReference;
let anomaliesRef: DatabaseReference;
let dashboardStatsRef: DatabaseReference;
let connectionStatusRef: DatabaseReference;
let isInitialized = false;
let isUsingMockData = false;
let reconnectTimer: any = null;
let connectionMonitorUnsubscribe: (() => void) | null = null;
let currentConnectionStatus: string = 'unknown';

// Initialize Firebase with configuration from server
/**
 * Set up connection monitoring to track Firebase database connection status
 */
export const setupConnectionMonitoring = () => {
  if (!isInitialized || !database) {
    console.warn('Cannot setup connection monitoring before Firebase is initialized');
    return false;
  }

  try {
    // Clean up existing connection monitoring if it exists
    if (connectionMonitorUnsubscribe) {
      connectionMonitorUnsubscribe();
      connectionMonitorUnsubscribe = null;
    }

    // Reference to the Firebase .info/connected special location (read-only)
    const connectedRef = ref(database, '.info/connected');
    
    // Create a user-writable status reference
    connectionStatusRef = ref(database, 'system/connectionStatus');

    // Monitor connection state
    connectionMonitorUnsubscribe = onValue(connectedRef, (snapshot) => {
      const isConnected = snapshot.val();
      currentConnectionStatus = isConnected ? 'connected' : 'disconnected';
      
      console.log(`Firebase connection status: ${currentConnectionStatus}`);
      
      if (isConnected) {
        // Connection established, clear any reconnection timers
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
        
        try {
          // Set a handler for when client disconnects - only in connected state
          onDisconnect(connectionStatusRef).set({
            status: 'disconnected',
            timestamp: serverTimestamp()
          });
          
          // Update current status
          set(connectionStatusRef, {
            status: 'connected',
            timestamp: serverTimestamp()
          });
        } catch (e) {
          console.error('Error updating connection status:', e);
        }
      } else {
        // Handle disconnection with automatic reconnection attempts
        try {
          set(connectionStatusRef, {
            status: 'disconnected',
            timestamp: serverTimestamp()
          });
        } catch (e) {
          console.error('Error updating disconnection status:', e);
        }
        
        // Start reconnection attempts if not already trying
        if (!reconnectTimer) {
          attemptReconnection();
        }
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error setting up connection monitoring:', error);
    return false;
  }
};

/**
 * Attempt to reconnect to Firebase with exponential backoff
 */
const attemptReconnection = (attempt = 1, maxAttempts = 10, baseDelay = 1000) => {
  if (attempt > maxAttempts) {
    console.error('Maximum reconnection attempts reached. Please check your internet connection.');
    return;
  }
  
  // Exponential backoff with jitter to prevent thundering herd
  const delay = Math.min(baseDelay * Math.pow(1.5, attempt - 1) + (Math.random() * 1000), 60000);
  
  console.log(`Attempting to reconnect to Firebase (attempt ${attempt}/${maxAttempts}) in ${delay}ms...`);
  
  reconnectTimer = setTimeout(() => {
    try {
      console.log(`Reconnecting to Firebase (attempt ${attempt})...`);
      
      // Force reconnection
      goOnline(database);
      
      // Check if reconnection was successful
      const checkConnectionTimer = setTimeout(() => {
        if (currentConnectionStatus === 'disconnected') {
          // Still disconnected, try again
          attemptReconnection(attempt + 1, maxAttempts, baseDelay);
        } else {
          console.log('Successfully reconnected to Firebase');
        }
      }, 2000);
      
    } catch (error) {
      console.error('Error during reconnection attempt:', error);
      // Try again with backoff
      attemptReconnection(attempt + 1, maxAttempts, baseDelay);
    }
  }, delay);
};

/**
 * Get the current connection status
 */
export const getConnectionStatus = () => {
  return currentConnectionStatus;
};

/**
 * Initialize Firebase with configuration from server
 */
export const initializeFirebase = async (): Promise<boolean> => {
  // If Firebase is already initialized, return true
  if (isInitialized) {
    console.log('Firebase already initialized');
    return true;
  }
  
  try {
    // Fetch Firebase configuration from server
    const config = await apiRequest<any>('/api/firebase-config');
    
    // Make sure the databaseURL is valid and in the correct format
    let databaseURL = config.databaseURL;
    
    // Check if the URL is valid (should be in the format https://project-id.firebaseio.com)
    if (!databaseURL) {
      console.warn('No Firebase Database URL provided.');
      return false;
    }
    
    // Ensure the URL doesn't end with a slash
    if (databaseURL.endsWith('/')) {
      databaseURL = databaseURL.slice(0, -1);
    }
    
    // Ensure the URL contains firebaseio.com
    if (!databaseURL.includes('firebaseio.com')) {
      console.warn('Invalid Firebase Database URL format.');
      return false;
    }
    
    // Update the config with the corrected URL
    config.databaseURL = databaseURL;
    
    // Update Firebase configuration
    firebaseConfig = {
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
      databaseURL: databaseURL,
    };
    
    // Initialize Firebase with the config
    console.log('Initializing Firebase with config:', firebaseConfig);
    
    try {
      // Initialize Firebase
      app = initializeApp(firebaseConfig);
      database = getDatabase(app);
      
      // Initialize database references
      requestLogsRef = ref(database, 'requestLogs');
      attackAlertsRef = ref(database, 'attackAlerts');
      threatIntelRef = ref(database, 'threatIntel');
      anomaliesRef = ref(database, 'anomalies');
      dashboardStatsRef = ref(database, 'dashboardStats');
      connectionStatusRef = ref(database, 'system/connectionStatus');
      
      isInitialized = true;
      console.log('Firebase initialized successfully');
      
      // Set up connection monitoring
      setupConnectionMonitoring();
      
      return true;
    } catch (initError: any) {
      // If the error is due to the app already being initialized, try to get the existing app
      if (initError.code === 'app/duplicate-app') {
        try {
          console.log('App already exists, getting existing app');
          
          // Use the existing Firebase app
          const { getApp } = await import('firebase/app');
          app = getApp();
          database = getDatabase(app);
          
          // Initialize database references
          requestLogsRef = ref(database, 'requestLogs');
          attackAlertsRef = ref(database, 'attackAlerts');
          threatIntelRef = ref(database, 'threatIntel');
          anomaliesRef = ref(database, 'anomalies');
          dashboardStatsRef = ref(database, 'dashboardStats');
          connectionStatusRef = ref(database, 'system/connectionStatus');
          
          isInitialized = true;
          console.log('Using existing Firebase app successfully');
          
          // Set up connection monitoring
          setupConnectionMonitoring();
          
          return true;
        } catch (existingAppError) {
          console.error('Error getting existing app:', existingAppError);
          return false;
        }
      } else {
        // Other initialization error
        console.error('Firebase initialization error:', initError);
        return false;
      }
    }
  } catch (error) {
    console.error('Error in Firebase configuration:', error);
    return false;
  }
};

/**
 * Helper function to handle Firebase errors - no fallback to mock data
 */
const handleFirebaseError = () => {
  console.error('Firebase configuration error - no fallback to mock data');
  isUsingMockData = false;
};

/**
 * Override Firebase methods with mock implementations
 * Note: We're not directly replacing the exported functions as they're constants
 * Instead, we'll use a proxy approach with the isUsingMockData flag
 */
const overrideWithMockService = () => {
  // Just mark that we're using mock data
  // The actual function implementations will check this flag
  isUsingMockData = true;
  console.log('Mock service override complete');
};

/**
 * Log a new request to Firebase
 */
export const logRequestToFirebase = async (requestData: any) => {
  // If we're using mock service, delegate to it
  if (isUsingMockData) {
    return await mockService.logRequestToMock(requestData);
  }
  
  try {
    const newRequestRef = push(requestLogsRef);
    await set(newRequestRef, {
      ...requestData,
      timestamp: serverTimestamp()
    });
    return newRequestRef.key;
  } catch (error) {
    console.error('Error logging request to Firebase:', error);
    return null;
  }
};

/**
 * Log a new attack alert to Firebase
 */
export const logAttackAlert = async (alertData: any) => {
  // If we're using mock service, delegate to it
  if (isUsingMockData) {
    return await mockService.logAttackAlert(alertData);
  }
  
  try {
    const newAlertRef = push(attackAlertsRef);
    await set(newAlertRef, {
      ...alertData,
      timestamp: serverTimestamp()
    });
    return newAlertRef.key;
  } catch (error) {
    console.error('Error logging attack alert to Firebase:', error);
    return null;
  }
};

/**
 * Update dashboard statistics in Firebase
 */
export const updateDashboardStats = async (stats: any) => {
  // If we're using mock service, delegate to it
  if (isUsingMockData) {
    return await mockService.updateDashboardStats(stats);
  }
  
  try {
    await set(dashboardStatsRef, {
      ...stats,
      lastUpdated: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating dashboard stats in Firebase:', error);
    return false;
  }
};

/**
 * Log an anomaly detection to Firebase
 */
export const logAnomaly = async (anomalyData: any) => {
  // If we're using mock service, delegate to it
  if (isUsingMockData) {
    return await mockService.logAnomaly(anomalyData);
  }
  
  try {
    const newAnomalyRef = push(anomaliesRef);
    await set(newAnomalyRef, {
      ...anomalyData,
      timestamp: serverTimestamp()
    });
    return newAnomalyRef.key;
  } catch (error) {
    console.error('Error logging anomaly to Firebase:', error);
    return null;
  }
};

/**
 * Subscribe to recent request logs
 */
export const subscribeToRecentLogs = (callback: (logs: any[]) => void, limit = 100) => {
  // If we're using mock service, delegate to it
  if (isUsingMockData) {
    return mockService.subscribeToRecentLogs(callback, limit);
  }
  
  try {
    const recentLogsQuery = query(requestLogsRef, limitToLast(limit));
    
    return onValue(recentLogsQuery, (snapshot) => {
      const logs: any[] = [];
      snapshot.forEach((childSnapshot) => {
        logs.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      callback(logs.reverse()); // Most recent first
    });
  } catch (error) {
    console.error('Error subscribing to Firebase logs:', error);
    // Return empty array
    callback([]);
    return () => {};
  }
};

/**
 * Subscribe to attack alerts
 */
export const subscribeToAttackAlerts = (callback: (alerts: any[]) => void, limit = 20) => {
  // If we're using mock service, delegate to it
  if (isUsingMockData) {
    return mockService.subscribeToAttackAlerts(callback, limit);
  }
  
  try {
    const alertsQuery = query(attackAlertsRef, limitToLast(limit));
    
    return onValue(alertsQuery, (snapshot) => {
      const alerts: any[] = [];
      snapshot.forEach((childSnapshot) => {
        alerts.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      callback(alerts.reverse()); // Most recent first
    });
  } catch (error) {
    console.error('Error subscribing to Firebase alerts:', error);
    // Return empty array
    callback([]);
    return () => {};
  }
};

/**
 * Subscribe to dashboard statistics
 */
export const subscribeToDashboardStats = (callback: (stats: any) => void) => {
  // If we're using mock service, delegate to it
  if (isUsingMockData) {
    return mockService.subscribeToDashboardStats(callback);
  }
  
  try {
    return onValue(dashboardStatsRef, (snapshot) => {
      const stats = snapshot.val() || {};
      callback(stats);
    });
  } catch (error) {
    console.error('Error subscribing to Firebase dashboard stats:', error);
    // Return empty object
    callback({});
    return () => {};
  }
};

/**
 * Subscribe to anomaly detections
 */
export const subscribeToAnomalies = (callback: (anomalies: any[]) => void, limit = 10) => {
  // If we're using mock service, delegate to it
  if (isUsingMockData) {
    return mockService.subscribeToAnomalies(callback, limit);
  }
  
  try {
    const anomaliesQuery = query(anomaliesRef, limitToLast(limit));
    
    return onValue(anomaliesQuery, (snapshot) => {
      const anomalies: any[] = [];
      snapshot.forEach((childSnapshot) => {
        anomalies.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      callback(anomalies.reverse()); // Most recent first
    });
  } catch (error) {
    console.error('Error subscribing to Firebase anomalies:', error);
    // Return empty array
    callback([]);
    return () => {};
  }
};

export { 
  database, 
  requestLogsRef, 
  attackAlertsRef, 
  threatIntelRef, 
  anomaliesRef, 
  dashboardStatsRef,
  connectionStatusRef
};
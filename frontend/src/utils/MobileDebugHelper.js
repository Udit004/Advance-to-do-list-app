// Mobile Push Notification Debug Helper for ZenList
import { 
    initializePushNotifications, 
    checkSubscriptionStatus, 
    sendTestNotification,
    isMobileDevice,
    supportsNativeNotifications
  } from './pushNotifications.js';
  
  class MobileDebugHelper {
    constructor() {
      this.isDebugging = false;
      this.logs = [];
      this.setupDebugPanel();
    }
  
    // Setup debug panel for mobile testing
    setupDebugPanel() {
      // Only show debug panel in development or if debug flag is set
      if (import.meta.env.DEV || localStorage.getItem('zenlist_debug') === 'true') {
        this.createDebugPanel();
      }
    }
  
    // Create floating debug panel
    createDebugPanel() {
      const panel = document.createElement('div');
      panel.id = 'mobile-debug-panel';
      panel.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 300px;
        max-height: 400px;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 15px;
        border-radius: 10px;
        font-family: monospace;
        font-size: 12px;
        z-index: 10000;
        overflow-y: auto;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        display: none;
      `;
  
      panel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <h3 style="margin: 0; color: #4CAF50;">📱 Push Debug</h3>
          <button id="close-debug" style="background: #f44336; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">×</button>
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong>Device Info:</strong>
          <div id="device-info" style="margin-left: 10px; font-size: 11px;"></div>
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong>Status:</strong>
          <div id="status-info" style="margin-left: 10px; font-size: 11px;"></div>
        </div>
        
        <div style="margin-bottom: 10px;">
          <button id="test-init" style="background: #2196F3; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-right: 5px;">Init</button>
          <button id="test-status" style="background: #FF9800; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-right: 5px;">Status</button>
          <button id="test-notification" style="background: #4CAF50; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Test</button>
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong>Logs:</strong>
          <div id="debug-logs" style="margin-left: 10px; font-size: 10px; max-height: 150px; overflow-y: auto; background: rgba(255, 255, 255, 0.1); padding: 5px; border-radius: 3px;"></div>
        </div>
      `;
  
      document.body.appendChild(panel);
      this.bindDebugEvents();
      this.updateDeviceInfo();
      this.startStatusMonitoring();
    }
  
    // Bind debug panel events
    bindDebugEvents() {
      const panel = document.getElementById('mobile-debug-panel');
      
      // Close button
      document.getElementById('close-debug').addEventListener('click', () => {
        panel.style.display = 'none';
      });
  
      // Test initialization
      document.getElementById('test-init').addEventListener('click', () => {
        this.testInitialization();
      });
  
      // Check status
      document.getElementById('test-status').addEventListener('click', () => {
        this.testStatus();
      });
  
      // Test notification
      document.getElementById('test-notification').addEventListener('click', () => {
        this.testNotification();
      });
    }
  
    // Show debug panel
    show() {
      const panel = document.getElementById('mobile-debug-panel');
      if (panel) {
        panel.style.display = 'block';
        this.updateDeviceInfo();
        this.updateStatus();
      }
    }
  
    // Hide debug panel
    hide() {
      const panel = document.getElementById('mobile-debug-panel');
      if (panel) {
        panel.style.display = 'none';
      }
    }
  
    // Update device information
    updateDeviceInfo() {
      const deviceInfo = document.getElementById('device-info');
      if (deviceInfo) {
        deviceInfo.innerHTML = `
          <div>Mobile: ${isMobileDevice() ? '✅' : '❌'}</div>
          <div>Native Support: ${supportsNativeNotifications() ? '✅' : '❌'}</div>
          <div>User Agent: ${navigator.userAgent.substring(0, 50)}...</div>
          <div>Platform: ${navigator.platform}</div>
          <div>Screen: ${window.screen.width}x${window.screen.height}</div>
          <div>Orientation: ${window.screen.orientation?.type || 'unknown'}</div>
          <div>Online: ${navigator.onLine ? '✅' : '❌'}</div>
        `;
      }
    }
  
    // Update status information
    async updateStatus() {
      const statusInfo = document.getElementById('status-info');
      if (statusInfo) {
        try {
          const status = await checkSubscriptionStatus();
          statusInfo.innerHTML = `
            <div>Supported: ${status.isSupported ? '✅' : '❌'}</div>
            <div>Permission: ${status.hasPermission ? '✅' : '❌'} (${Notification.permission})</div>
            <div>Subscribed: ${status.isSubscribed ? '✅' : '❌'}</div>
            <div>Service Worker: ${navigator.serviceWorker.controller ? '✅' : '❌'}</div>
          `;
        } catch (error) {
          statusInfo.innerHTML = `<div style="color: #f44336;">Error: ${error.message}</div>`;
        }
      }
    }
  
    // Test initialization
    async testInitialization() {
      this.log('🚀 Testing push notification initialization...');
      
      try {
        // Use a test user ID
        const testUserId = 'test-user-' + Date.now();
        const result = await initializePushNotifications(testUserId);
        
        if (result) {
          this.log('✅ Initialization successful');
        } else {
          this.log('❌ Initialization failed');
        }
        
        this.updateStatus();
      } catch (error) {
        this.log(`❌ Initialization error: ${error.message}`);
      }
    }
  
    // Test status check
    async testStatus() {
      this.log('🔍 Checking push notification status...');
      
      try {
        const status = await checkSubscriptionStatus();
        this.log(`Status: ${JSON.stringify(status, null, 2)}`);
        this.updateStatus();
      } catch (error) {
        this.log(`❌ Status check error: ${error.message}`);
      }
    }
  
    // Test notification
    async testNotification() {
      this.log('🔔 Testing push notification...');
      
      try {
        const result = await sendTestNotification();
        
        if (result) {
          this.log('✅ Test notification sent successfully');
        } else {
          this.log('❌ Test notification failed');
        }
      } catch (error) {
        this.log(`❌ Test notification error: ${error.message}`);
      }
    }
  
    // Start monitoring status changes
    startStatusMonitoring() {
      // Monitor service worker state
      if (navigator.serviceWorker) {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          this.log('🔄 Service worker controller changed');
          this.updateStatus();
        });
  
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.log(`📨 SW Message: ${event.data.type}`);
          if (event.data.type === 'NOTIFICATION_SHOWN') {
            this.log('✅ Notification shown successfully');
          }
        });
      }
  
      // Monitor online/offline status
      window.addEventListener('online', () => {
        this.log('📶 Device came online');
        this.updateDeviceInfo();
      });
  
      window.addEventListener('offline', () => {
        this.log('📴 Device went offline');
        this.updateDeviceInfo();
      });
  
      // Monitor visibility changes
      document.addEventListener('visibilitychange', () => {
        this.log(`👁️ Visibility changed: ${document.visibilityState}`);
      });
  
      // Monitor orientation changes
      window.addEventListener('orientationchange', () => {
        this.log('🔄 Orientation changed');
        setTimeout(() => {
          this.updateDeviceInfo();
        }, 500);
      });
    }
  
    // Log debug messages
    log(message) {
      const timestamp = new Date().toLocaleTimeString();
      const logEntry = `[${timestamp}] ${message}`;
      
      console.log(logEntry);
      this.logs.push(logEntry);
      
      // Keep only last 50 logs
      if (this.logs.length > 50) {
        this.logs.shift();
      }
      
      // Update debug panel
      const debugLogs = document.getElementById('debug-logs');
      if (debugLogs) {
        debugLogs.innerHTML = this.logs.map(log => `<div>${log}</div>`).join('');
        debugLogs.scrollTop = debugLogs.scrollHeight;
      }
    }
  
    // Test comprehensive mobile functionality
    async runFullMobileTest() {
      this.log('🧪 Running comprehensive mobile test...');
      
      // Test 1: Device compatibility
      this.log('📱 Testing device compatibility...');
      const isMobile = isMobileDevice();
      const hasNativeSupport = supportsNativeNotifications();
      
      this.log(`Mobile device: ${isMobile ? '✅' : '❌'}`);
      this.log(`Native support: ${hasNativeSupport ? '✅' : '❌'}`);
      
      // Test 2: Service worker registration
      this.log('🔧 Testing service worker registration...');
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        this.log('✅ Service worker registered');
        
        await navigator.serviceWorker.ready;
        this.log('✅ Service worker ready');
      } catch (error) {
        this.log(`❌ Service worker error: ${error.message}`);
        return false;
      }
      
      // Test 3: Permission request
      this.log('🔐 Testing permission request...');
      try {
        const permission = await Notification.requestPermission();
        this.log(`Permission result: ${permission}`);
        
        if (permission !== 'granted') {
          this.log('❌ Permission not granted');
          return false;
        }
      } catch (error) {
        this.log(`❌ Permission error: ${error.message}`);
        return false;
      }
      
      // Test 4: Push subscription
      this.log('📡 Testing push subscription...');
      try {
        const testUserId = 'test-user-' + Date.now();
        const result = await initializePushNotifications(testUserId);
        
        if (result) {
          this.log('✅ Push subscription successful');
        } else {
          this.log('❌ Push subscription failed');
          return false;
        }
      } catch (error) {
        this.log(`❌ Push subscription error: ${error.message}`);
        return false;
      }
      
      // Test 5: Test notification
      this.log('🔔 Testing notification display...');
      try {
        const result = await sendTestNotification();
        
        if (result) {
          this.log('✅ Test notification sent');
        } else {
          this.log('❌ Test notification failed');
        }
      } catch (error) {
        this.log(`❌ Test notification error: ${error.message}`);
      }
      
      this.log('🎉 Comprehensive mobile test completed!');
      return true;
    }
  }
  
  // Initialize debug helper
  const debugHelper = new MobileDebugHelper();
  
  // Export for global access
  window.MobileDebugHelper = debugHelper;
  
  // Keyboard shortcut to show debug panel (mobile: triple tap)
  let tapCount = 0;
  let tapTimer = null;
  
  document.addEventListener('click', (event) => {
    if (event.target.tagName === 'BODY' || event.target.tagName === 'HTML') {
      tapCount++;
      
      if (tapTimer) {
        clearTimeout(tapTimer);
      }
      
      tapTimer = setTimeout(() => {
        if (tapCount >= 3) {
          debugHelper.show();
        }
        tapCount = 0;
      }, 500);
    }
  });
  
  // Auto-enable debug mode on mobile development
  if (isMobileDevice() && import.meta.env.DEV) {
    console.log('📱 Mobile development mode - Debug helper enabled');
    console.log('Triple tap on empty space to show debug panel');
  }
  
  export default debugHelper;
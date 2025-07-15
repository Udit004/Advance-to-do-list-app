// Mobile Push Notification Utilities
import { 
  initializePushNotifications, 
  checkSubscriptionStatus, 
  subscribeUserToPush,
  unsubscribeFromPush,
  isPushNotificationSupported,
  isMobileDevice,
  handleVisibilityChange,
  handleInstallPrompt
} from './pushNotifications.js';

// Mobile-specific push notification manager
export class MobilePushManager {
  constructor() {
    this.isInitialized = false;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.installPrompt = handleInstallPrompt();
    
    // Initialize visibility change handler
    handleVisibilityChange();
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      this.initialize();
    }
  }

  async initialize() {
    if (this.isInitialized) return;
    
    console.log('Initializing Mobile Push Manager...');
    
    // Check if push notifications are supported
    if (!isPushNotificationSupported()) {
      console.warn('Push notifications are not supported on this device');
      return;
    }
    
    // Add service worker message listener
    this.setupServiceWorkerMessageListener();
    
    // Handle network status changes
    this.setupNetworkStatusListener();
    
    // Handle app state changes
    this.setupAppStateListener();
    
    this.isInitialized = true;
    console.log('Mobile Push Manager initialized successfully');
  }

  // Setup service worker message listener
  setupServiceWorkerMessageListener() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, data } = event.data;
        
        switch (type) {
          case 'NOTIFICATION_SHOWN':
            this.handleNotificationShown(data);
            break;
          case 'NOTIFICATION_CLICKED':
            this.handleNotificationClicked(data);
            break;
          case 'SYNC_TRIGGERED':
            this.handleSyncTriggered(data);
            break;
          case 'PERIODIC_SYNC':
            this.handlePeriodicSync(data);
            break;
        }
      });
    }
  }

  // Setup network status listener
  setupNetworkStatusListener() {
    window.addEventListener('online', () => {
      console.log('Device came online');
      this.handleOnline();
    });

    window.addEventListener('offline', () => {
      console.log('Device went offline');
      this.handleOffline();
    });
  }

  // Setup app state listener for mobile
  setupAppStateListener() {
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handleAppBackground();
      } else {
        this.handleAppForeground();
      }
    });

    // Handle page focus/blur
    window.addEventListener('focus', () => this.handleAppForeground());
    window.addEventListener('blur', () => this.handleAppBackground());

    // Handle mobile-specific events
    if (isMobileDevice()) {
      // Handle orientation changes
      window.addEventListener('orientationchange', () => {
        setTimeout(() => this.handleOrientationChange(), 500);
      });

      // Handle touch events for better mobile experience
      document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
      
      // Handle device motion for enhanced mobile features
      if (window.DeviceMotionEvent) {
        window.addEventListener('devicemotion', this.handleDeviceMotion.bind(this));
      }
    }
  }

  // Handle notification shown event
  handleNotificationShown(data) {
    console.log('Notification shown:', data);
    
    // Track notification analytics
    this.trackNotificationEvent('shown', data);
    
    // Update UI if needed
    this.updateUIForNotification('shown', data);
  }

  // Handle notification clicked event
  handleNotificationClicked(data) {
    console.log('Notification clicked:', data);
    
    // Track notification analytics
    this.trackNotificationEvent('clicked', data);
    
    // Handle specific actions based on notification data
    if (data.action) {
      this.handleNotificationAction(data.action, data);
    }
    
    // Update UI
    this.updateUIForNotification('clicked', data);
  }

  // Handle sync triggered event
  handleSyncTriggered(data) {
    console.log('Sync triggered:', data);
    
    // Perform offline data sync
    this.syncOfflineData();
  }

  // Handle periodic sync
  handlePeriodicSync(data) {
    console.log('Periodic sync:', data);
    
    // Refresh data periodically
    this.refreshData();
  }

  // Handle device coming online
  async handleOnline() {
    console.log('Device is online - checking push subscription');
    
    try {
      const status = await checkSubscriptionStatus();
      
      if (!status.isSubscribed && status.hasPermission) {
        // Try to resubscribe if permission is granted but not subscribed
        console.log('Attempting to resubscribe...');
        await this.resubscribe();
      }
      
      // Sync any offline data
      await this.syncOfflineData();
      
      // Update UI to show online status
      this.updateConnectionStatus(true);
      
    } catch (error) {
      console.error('Error handling online event:', error);
    }
  }

  // Handle device going offline
  handleOffline() {
    console.log('Device is offline');
    
    // Update UI to show offline status
    this.updateConnectionStatus(false);
    
    // Enable offline mode features
    this.enableOfflineMode();
  }

  // Handle app coming to foreground
  async handleAppForeground() {
    console.log('App came to foreground');
    
    // Check subscription status
    const status = await checkSubscriptionStatus();
    console.log('Current subscription status:', status);
    
    // Refresh data if needed
    if (navigator.onLine) {
      await this.refreshData();
    }
    
    // Clear any displayed notifications
    this.clearDisplayedNotifications();
  }

  // Handle app going to background
  handleAppBackground() {
    console.log('App went to background');
    
    // Register background sync if supported
    this.registerBackgroundSync();
  }

  // Handle orientation change
  handleOrientationChange() {
    console.log('Orientation changed');
    
    // Adjust UI for new orientation
    this.adjustUIForOrientation();
  }

  // Handle touch start for mobile interactions
  handleTouchStart(event) {
    // Implement mobile-specific touch handling
    this.lastTouchTime = Date.now();
  }

  // Handle device motion for enhanced mobile features
  handleDeviceMotion(event) {
    // Implement shake detection or other motion-based features
    const acceleration = event.accelerationIncludingGravity;
    
    if (acceleration) {
      const totalAcceleration = Math.sqrt(
        acceleration.x * acceleration.x +
        acceleration.y * acceleration.y +
        acceleration.z * acceleration.z
      );
      
      // Detect shake gesture (threshold can be adjusted)
      if (totalAcceleration > 25) {
        this.handleShakeGesture();
      }
    }
  }

  // Initialize push notifications for mobile
  async initializePush(userId) {
    if (!userId) {
      console.error('User ID is required for push initialization');
      return false;
    }

    try {
      console.log('Initializing push notifications for mobile...');
      
      // Show loading indicator
      this.showLoadingIndicator('Setting up notifications...');
      
      const success = await initializePushNotifications(userId);
      
      if (success) {
        console.log('Push notifications initialized successfully');
        this.showSuccessMessage('Notifications enabled successfully!');
        
        // Show install prompt if available
        if (this.installPrompt.isInstallable()) {
          this.showInstallPrompt();
        }
        
        return true;
      } else {
        console.error('Failed to initialize push notifications');
        this.showErrorMessage('Failed to enable notifications. Please try again.');
        return false;
      }
      
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      this.showErrorMessage('An error occurred while setting up notifications.');
      return false;
    } finally {
      this.hideLoadingIndicator();
    }
  }

  // Subscribe to push notifications
  async subscribe(userId) {
    if (!userId) {
      console.error('User ID is required for subscription');
      return false;
    }

    try {
      this.showLoadingIndicator('Subscribing to notifications...');
      
      const success = await subscribeUserToPush(userId);
      
      if (success) {
        this.showSuccessMessage('Successfully subscribed to notifications!');
        return true;
      } else {
        this.showErrorMessage('Failed to subscribe to notifications.');
        return false;
      }
      
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      this.showErrorMessage('An error occurred while subscribing.');
      return false;
    } finally {
      this.hideLoadingIndicator();
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(userId) {
    try {
      this.showLoadingIndicator('Unsubscribing from notifications...');
      
      const success = await unsubscribeFromPush(userId);
      
      if (success) {
        this.showSuccessMessage('Successfully unsubscribed from notifications.');
        return true;
      } else {
        this.showErrorMessage('Failed to unsubscribe from notifications.');
        return false;
      }
      
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      this.showErrorMessage('An error occurred while unsubscribing.');
      return false;
    } finally {
      this.hideLoadingIndicator();
    }
  }

  // Check current subscription status
  async getSubscriptionStatus() {
    try {
      const status = await checkSubscriptionStatus();
      return status;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return {
        isSubscribed: false,
        hasPermission: false,
        isSupported: false,
        error: error.message
      };
    }
  }

  // Resubscribe if needed
  async resubscribe(userId) {
    if (!userId) {
      console.error('User ID is required for resubscription');
      return false;
    }

    try {
      console.log('Attempting to resubscribe...');
      return await this.subscribe(userId);
    } catch (error) {
      console.error('Error resubscribing:', error);
      return false;
    }
  }

  // Sync offline data
  async syncOfflineData() {
    try {
      console.log('Syncing offline data...');
      
      // Implement your offline data sync logic here
      // This is where you would sync any cached data when back online
      
      // Example: Send any pending notifications or updates
      const pendingData = this.getPendingData();
      if (pendingData.length > 0) {
        await this.sendPendingData(pendingData);
        this.clearPendingData();
      }
      
    } catch (error) {
      console.error('Error syncing offline data:', error);
    }
  }

  // Refresh data
  async refreshData() {
    try {
      console.log('Refreshing data...');
      
      // Implement your data refresh logic here
      // This could trigger a data fetch from your API
      
      // Dispatch custom event for app to handle
      window.dispatchEvent(new CustomEvent('pushManagerDataRefresh'));
      
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }

  // Register background sync
  registerBackgroundSync() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        return registration.sync.register('background-sync');
      }).catch(error => {
        console.error('Background sync registration failed:', error);
      });
    }
  }

  // Clear displayed notifications
  clearDisplayedNotifications() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.getNotifications().then(notifications => {
          notifications.forEach(notification => {
            notification.close();
          });
        });
      });
    }
  }

  // Handle notification actions
  handleNotificationAction(action, data) {
    console.log('Handling notification action:', action, data);
    
    switch (action) {
      case 'open':
        // Open specific page or section
        window.location.href = data.url || '/';
        break;
      case 'dismiss':
        // Just dismiss the notification
        break;
      case 'complete':
        // Mark task as complete
        this.handleCompleteTask(data);
        break;
      case 'snooze':
        // Snooze the notification
        this.handleSnoozeNotification(data);
        break;
      default:
        console.warn('Unknown notification action:', action);
    }
  }

  // Handle shake gesture
  handleShakeGesture() {
    console.log('Shake gesture detected');
    
    // Implement shake-to-refresh or other shake actions
    window.dispatchEvent(new CustomEvent('shakeGesture'));
  }

  // Show install prompt
  async showInstallPrompt() {
    try {
      const accepted = await this.installPrompt.showInstallPrompt();
      if (accepted) {
        console.log('App installed successfully');
      }
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  }

  // UI Helper Methods
  showLoadingIndicator(message) {
    // Implement loading indicator
    console.log('Loading:', message);
    
    // Dispatch event for UI to handle
    window.dispatchEvent(new CustomEvent('pushManagerLoading', { 
      detail: { message, show: true } 
    }));
  }

  hideLoadingIndicator() {
    // Hide loading indicator
    window.dispatchEvent(new CustomEvent('pushManagerLoading', { 
      detail: { show: false } 
    }));
  }

  showSuccessMessage(message) {
    console.log('Success:', message);
    
    // Dispatch event for UI to handle
    window.dispatchEvent(new CustomEvent('pushManagerMessage', { 
      detail: { message, type: 'success' } 
    }));
  }

  showErrorMessage(message) {
    console.error('Error:', message);
    
    // Dispatch event for UI to handle
    window.dispatchEvent(new CustomEvent('pushManagerMessage', { 
      detail: { message, type: 'error' } 
    }));
  }

  updateConnectionStatus(isOnline) {
    // Update UI to show connection status
    window.dispatchEvent(new CustomEvent('connectionStatusChange', { 
      detail: { isOnline } 
    }));
  }

  updateUIForNotification(type, data) {
    // Update UI based on notification events
    window.dispatchEvent(new CustomEvent('notificationEvent', { 
      detail: { type, data } 
    }));
  }

  adjustUIForOrientation() {
    // Adjust UI for orientation changes
    window.dispatchEvent(new CustomEvent('orientationChange'));
  }

  enableOfflineMode() {
    // Enable offline mode features
    window.dispatchEvent(new CustomEvent('offlineModeEnabled'));
  }

  // Analytics and tracking
  trackNotificationEvent(event, data) {
    // Implement your analytics tracking here
    console.log('Tracking notification event:', event, data);
    
    // Example: Send to analytics service
    // analytics.track('notification_' + event, data);
  }

  // Data management methods
  getPendingData() {
    // Get pending data from localStorage or IndexedDB
    try {
      const pending = localStorage.getItem('pendingPushData');
      return pending ? JSON.parse(pending) : [];
    } catch (error) {
      console.error('Error getting pending data:', error);
      return [];
    }
  }

  async sendPendingData(data) {
    // Send pending data to server
    try {
      // Implement your API call here
      console.log('Sending pending data:', data);
      
      // Example API call
      // await API.post('/sync/pending', { data });
      
    } catch (error) {
      console.error('Error sending pending data:', error);
    }
  }

  clearPendingData() {
    // Clear pending data after successful sync
    try {
      localStorage.removeItem('pendingPushData');
    } catch (error) {
      console.error('Error clearing pending data:', error);
    }
  }

  // Task-specific handlers
  handleCompleteTask(data) {
    // Handle task completion from notification
    console.log('Completing task from notification:', data);
    
    // Dispatch event for app to handle
    window.dispatchEvent(new CustomEvent('completeTaskFromNotification', { 
      detail: data 
    }));
  }

  handleSnoozeNotification(data) {
    // Handle notification snoozing
    console.log('Snoozing notification:', data);
    
    // Dispatch event for app to handle
    window.dispatchEvent(new CustomEvent('snoozeNotification', { 
      detail: data 
    }));
  }

  // Cleanup method
  destroy() {
    // Clean up event listeners and resources
    console.log('Destroying Mobile Push Manager...');
    
    // Remove event listeners
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    
    this.isInitialized = false;
  }
}

// Create singleton instance
export const mobilePushManager = new MobilePushManager();

// Export individual functions for convenience
export {
  initializePushNotifications,
  subscribeUserToPush,
  unsubscribeFromPush,
  checkSubscriptionStatus,
  isPushNotificationSupported,
  isMobileDevice
};
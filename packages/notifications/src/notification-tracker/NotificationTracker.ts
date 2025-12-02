export interface TrackingMetadata {
  timestamp: number
  strategy: 'render' | 'dismiss' | 'duration' | 'max-views'
}

export interface NotificationTracker {
  // Check if a notification has been processed
  isProcessed(notificationId: string): Promise<boolean>
  // Get all processed notification IDs
  getProcessedIds(): Promise<Set<string>>
  // Track notification as processed
  track(notificationId: string, metadata: TrackingMetadata): Promise<void>
  // Optional cleanup for old entries
  cleanup?(olderThan: number): Promise<void>
}

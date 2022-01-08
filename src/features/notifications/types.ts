export enum NotificationSeverity {
  info = 'info',
  warning = 'warning',
  error = 'error',
}

export interface AppNotification {
  message: string
  severity: NotificationSeverity
  hideDelay?: number // If omitted, the default delay time is used
}

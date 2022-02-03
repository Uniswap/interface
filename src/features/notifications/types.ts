export enum NotificationSeverity {
  Info = 'info',
  Warning = 'warning',
  Error = 'error',
}

export interface AppNotification {
  message: string
  severity: NotificationSeverity
  hideDelay?: number // If omitted, the default delay time is used
}

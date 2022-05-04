export enum AppNotificationType {
  Default,
  WalletConnect,
}

export interface AppNotificationBase {
  type: AppNotificationType
  title: string
  hideDelay?: number // If omitted, the default delay time is used
}

export interface AppNotificationDefault extends AppNotificationBase {
  type: AppNotificationType.Default
}
export interface WalletConnectNotification extends AppNotificationBase {
  type: AppNotificationType.WalletConnect
  imageUrl: string
  chainId: string
}

export type AppNotification = AppNotificationDefault | WalletConnectNotification

// Navigation link prefixes for mobile
// These are parsed by the navigation handler in MobileNotificationService
export const MOBILE_NAV_PREFIX = 'mobile://'
export const UNITAG_NAV_PREFIX = 'unitag://'

// Using 'local:' prefix to indicate these are client-only notifications
// This prevents the API tracker from sending AckNotification calls to the backend
export enum BannerId {
  NoAppFees = 'local:no_app_fees_banner',
  FundWallet = 'local:fund_wallet_banner',
  BridgedAssets = 'local:bridged_assets_banner',
  BridgedAssetsV2 = 'local:bridged_assets_v2_banner',

  PushNotifications = 'local:push_notifications_banner',
  RecoveryBackup = 'local:recovery_backup_banner',
  UnitagClaim = 'local:unitag_claim_banner',
}

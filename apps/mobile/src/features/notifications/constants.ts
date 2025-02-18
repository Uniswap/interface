// Enum value represents tag name in OneSignal
export enum NotifSettingType {
  GeneralUpdates = 'settings_general_updates_enabled',
  PriceAlerts = 'settings_price_alerts_enabled',
}

// Enum value represents tag name in OneSignal
export enum OneSignalUserTagField {
  OnboardingCompletedAt = 'onboarding_completed_at',
  OnboardingImportType = 'onboarding_import_type',
  OnboardingWalletAddress = 'onboarding_wallet_address',
  SwapLastCompletedAt = 'swap_last_completed_at',
  AccountIsUnfunded = 'account_is_unfunded',
  GatingUnfundedWalletsEnabled = 'gating_unfunded_wallets_enabled',
  GatingPriceAlertsEnabled = 'gating_price_alerts_enabled',
}

export enum NotificationType {
  UnfundedWalletReminder = 'unfunded_wallet_reminder',
  PriceAlert = 'price_alert',
}

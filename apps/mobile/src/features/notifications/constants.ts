// Enum value represents tag name in OneSignal
export enum NotifSettingType {
  GeneralUpdates = 'settings_general_updates_enabled',
}

// Enum value represents tag name in OneSignal
export enum OneSignalUserTagField {
  OnboardingCompletedAt = 'onboarding_completed_at',
  OnboardingImportType = 'onboarding_import_type',
  OnboardingWalletAddress = 'onboarding_wallet_address',
  SwapLastCompletedAt = 'swap_last_completed_at',
  AccountIsUnfunded = 'account_is_unfunded',
  GatingUnfundedWalletsEnabled = 'gating_unfunded_wallets_enabled',
  ActiveWalletAddress = 'active_wallet_address',
}

export enum NotificationType {
  UnfundedWalletReminder = 'unfunded_wallet_reminder',
}

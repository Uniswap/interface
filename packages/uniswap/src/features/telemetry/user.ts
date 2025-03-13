import { CustomUserProperties } from '@uniswap/analytics-events'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { UserPropertyValue, analytics } from 'utilities/src/telemetry/analytics/analytics'

/**
 * User properties tied to user rather than events
 */
export enum MobileUserPropertyName {
  ActiveWalletAddress = 'active_wallet_address',
  ActiveWalletType = 'active_wallet_type',
  AdvertisingId = 'advertising_id',
  AndroidPerfClass = 'android_perf_class',
  AppOpenAuthMethod = 'app_open_auth_method',
  AppVersion = 'app_version',
  Currency = 'currency',
  DarkMode = 'is_dark_mode',
  HasLoadedENS = 'has_loaded_ens',
  HasLoadedUnitag = 'has_loaded_unitag',
  IsCloudBackedUp = 'is_cloud_backed_up',
  IsHideSmallBalancesEnabled = 'is_hide_small_balances_enabled',
  IsHideSpamTokensEnabled = 'is_hide_spam_tokens_enabled',
  IsPushEnabled = 'is_push_enabled',
  Language = 'language',
  MnemonicCount = 'mnemonic_count',
  TestnetModeEnabled = 'testnet_mode_enabled',
  TransactionAuthMethod = 'transaction_auth_method',
  WalletSignerAccounts = `wallet_signer_accounts`,
  WalletSignerCount = 'wallet_signer_count',
  WalletSwapProtectionSetting = 'wallet_swap_protection_setting',
  WalletViewOnlyCount = 'wallet_view_only_count',
  // alphabetize additional values.
}

/**
 * User properties tied to user rather than events
 */
export enum ExtensionUserPropertyName {
  ActiveWalletAddress = 'active_wallet_address',
  ActiveWalletType = 'active_wallet_type',
  AppVersion = 'app_version',
  Currency = 'currency',
  DarkMode = 'is_dark_mode',
  IsHideSmallBalancesEnabled = 'is_hide_small_balances_enabled',
  IsHideSpamTokensEnabled = 'is_hide_spam_tokens_enabled',
  Language = 'language',
  TestnetModeEnabled = 'testnet_mode_enabled',
  WalletSignerAccounts = `wallet_signer_accounts`,
  WalletSignerCount = 'wallet_signer_count',
  WalletViewOnlyCount = 'wallet_view_only_count',
  // alphabetize additional values.
}

export function setUserProperty(
  property: MobileUserPropertyName | ExtensionUserPropertyName | CustomUserProperties,
  value: UserPropertyValue,
  insert?: boolean,
): void {
  analytics.setUserProperty(property, value, insert)
}

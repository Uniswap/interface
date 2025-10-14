// biome-ignore lint/style/noRestrictedImports: legacy import will be migrated
import { analytics, UserPropertyValue } from 'utilities/src/telemetry/analytics/analytics'

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
  HasMatchingMnemonicAndPrivateKey = 'has_matching_mnemonic_and_private_key',
  IsCloudBackedUp = 'is_cloud_backed_up',
  BackupTypes = 'backup_types',
  IsHideSmallBalancesEnabled = 'is_hide_small_balances_enabled',
  IsHideSpamTokensEnabled = 'is_hide_spam_tokens_enabled',
  IsPushEnabled = 'is_push_enabled',
  Language = 'language',
  MnemonicCount = 'mnemonic_count',
  PrivateKeyCount = 'private_key_count',
  TestnetModeEnabled = 'testnet_mode_enabled',
  TransactionAuthMethod = 'transaction_auth_method',
  WalletSignerAccounts = `wallet_signer_accounts`,
  WalletSignerCount = 'wallet_signer_count',
  WalletSwapProtectionSetting = 'wallet_swap_protection_setting',
  WalletViewOnlyCount = 'wallet_view_only_count',
  WindowHeight = 'window_height',
  WindowWidth = 'window_width',
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
  BackupTypes = 'backup_types',
  HasLoadedENS = 'has_loaded_ens',
  HasLoadedUnitag = 'has_loaded_unitag',
  IsHideSmallBalancesEnabled = 'is_hide_small_balances_enabled',
  IsHideSpamTokensEnabled = 'is_hide_spam_tokens_enabled',
  Language = 'language',
  TestnetModeEnabled = 'testnet_mode_enabled',
  WalletSignerAccounts = `wallet_signer_accounts`,
  WalletSignerCount = 'wallet_signer_count',
  WalletViewOnlyCount = 'wallet_view_only_count',
  // alphabetize additional values.
}

// The ones marked 'for EVM' are bc they were introduced before SVM support was added. Want to maintain analytics backwards compatibility.
export enum InterfaceUserPropertyName {
  AllWalletAddressesConnected = 'all_wallet_addresses_connected',
  AllSVMWalletAddressesConnected = 'all_svm_wallet_addresses_connected',
  AllWalletChainIds = 'all_wallet_chain_ids', // for EVM
  Browser = 'browser',
  ChainId = 'chain_id', // for EVM
  DarkMode = 'is_dark_mode',
  ExpertMode = 'is_expert_mode',
  GitCommitHash = 'git_commit_hash',
  PeerWalletAgent = 'peer_wallet_agent',
  RouterPreference = 'router_preference',
  ScreenResolutionHeight = 'screen_resolution_height',
  ScreenResolutionWidth = 'screen_resolution_width',
  SupportsAtomicBatching = 'supports_atomic_batching',
  TestnetModeEnabled = 'testnet_mode_enabled',
  UserAgent = 'user_agent',
  WalletAddress = 'wallet_address', // for EVM
  WalletAddressSVM = 'wallet_address_svm',
  WalletName = 'wallet_name', // for EVM
  WalletNameSVM = 'wallet_name_svm',
  WalletType = 'wallet_type', // for EVM
  WalletTypeSVM = 'wallet_type_svm',
  WalletVersion = 'wallet_version', // for EVM
}

export enum UniswapUserPropertyName {
  IsDelegatedEOA = 'is_delegated_eoa',
}

// eslint-disable-next-line max-params
export function setUserProperty(
  property: MobileUserPropertyName | ExtensionUserPropertyName | InterfaceUserPropertyName | UniswapUserPropertyName,
  value: UserPropertyValue,
  insert?: boolean,
): void {
  analytics.setUserProperty(property, value, insert)
}

/**
 * Event names that occur in this specific application
 */
export enum ExtensionEventName {
  ExtensionLoad = 'Extension Load',
  // alphabetize additional values.
}

/**
 * Possible names for the screen property in TraceContext
 */
export const enum ScreenName {}
// alphabetize additional values.

/**
 * Possible names for the modal property in TraceContext
 */
export const enum ModalName {}
// alphabetize additional values.

/**
 * Possible names for the section property in TraceContext
 */
export const enum SectionName {}
// alphabetize additional values.

/**
 * Possible names for the element property in TraceContext
 */
export const enum ElementName {}
// alphabetize additional values.

/**
 * User properties tied to user rather than events
 */
export enum UserPropertyName {
  ActiveWalletAddress = 'active_wallet_address',
  ActiveWalletType = 'active_wallet_type',
  AppVersion = 'app_version',
  DarkMode = 'is_dark_mode',
  IsHideSmallBalancesEnabled = 'is_hide_small_balances_enabled',
  IsHideSpamTokensEnabled = 'is_hide_spam_tokens_enabled',
  WalletSignerAccounts = `wallet_signer_accounts`,
  WalletSignerCount = 'wallet_signer_count',
  WalletViewOnlyCount = 'wallet_view_only_count',
  // alphabetize additional values.
}

/** Known navbar search result types */
export enum NavBarSearchTypes {
  COLLECTION_SUGGESTION = 'collection-suggestion',
  COLLECTION_TRENDING = 'collection-trending',
  RECENT_SEARCH = 'recent',
  TOKEN_SUGGESTION = 'token-suggestion',
  TOKEN_TRENDING = 'token-trending',
}

export enum WalletConnectionResult {
  FAILED = 'Failed',
  SUCCEEDED = 'Succeeded',
}

export enum RiskCheckResult {
  ERROR = 'Error',
  FAILED = 'Failed',
  PASSED = 'Passed',
}

export enum AppDownloadPlatform {
  ANDROID = 'android',
  IOS = 'ios',
}

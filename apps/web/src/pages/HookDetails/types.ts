export enum HookDetailsStatus {
  Valid = 'valid',
  Loading = 'loading',
  Error = 'error',
  NotFound = 'not-found',
  InvalidAddress = 'invalid-address',
  UnsupportedChain = 'unsupported-chain',
}

export type HookDetailsFallbackStatus = Exclude<HookDetailsStatus, HookDetailsStatus.Valid>

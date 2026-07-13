/**
 * Derived result form delegation check
 */
export interface DelegationCheckResult {
  needsDelegation: boolean
  contractAddress?: Address
  currentDelegationAddress?: Address | null
  latestDelegationAddress?: Address
  isWalletDelegatedToUniswap?: boolean
}

/**
 * Smart wallet capability status for a chain.
 * - `supported`: wallet is already delegated to Uniswap
 * - `ready`: wallet can be delegated (fresh delegation / pending upgrade)
 * - `unsupported`: not delegation-capable (or no smart wallet consent)
 */
export type SmartWalletCapabilityStatus = 'unsupported' | 'supported' | 'ready'

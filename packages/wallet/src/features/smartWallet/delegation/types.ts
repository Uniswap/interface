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

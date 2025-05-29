export interface DelegatedState {
  // chainId -> address mapping
  delegations: Record<string, string>
  // The currently active chain ID
  activeChainId?: number
}

export interface SwapDelegationInfo {
  delegationAddress?: Address
  delegationInclusion: boolean
}

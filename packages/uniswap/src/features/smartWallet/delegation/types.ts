import type { TradingApi } from '@universe/api'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'

export interface DelegatedState {
  // chainId -> address mapping
  delegations: Record<string, string>
  // The currently active chain ID
  activeChainId?: number
}

export interface SwapDelegationInfo {
  delegationAddress?: Address
  delegationInclusion: boolean
  isWalletDelegatedToUniswap?: boolean
}

/**
 * Signs an EIP-7702 delegation authorization for the active account on the given chain,
 * returned in Trading API wire format (or `undefined` when no delegation is needed / the
 * environment can't sign). Provided by wallet environments (mobile/extension) and attached
 * to 4337 swap/approval requests before the backend's paymaster + bundler simulation.
 */
export type SignDelegationAuthorizationFn = (params: {
  chainId: UniverseChainId
  sender: Address
  delegationAddress: Address
}) => Promise<TradingApi.Eip7702Authorization | undefined>

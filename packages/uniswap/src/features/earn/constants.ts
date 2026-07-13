import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainedActionsSupportedChainIds } from 'uniswap/src/features/transactions/swap/utils/chainedActions'

export const EARN_SUPPORTED_CHAIN_IDS = [UniverseChainId.Mainnet]
export const DEFAULT_WITHDRAW_CHAIN_ID: UniverseChainId = UniverseChainId.Mainnet

// Earn deposits route through chained actions, so source-chain support intentionally matches chained-action support.
export function getEarnDepositSourceSupportedChainIds(): UniverseChainId[] {
  return getChainedActionsSupportedChainIds()
}

export function getEarnWithdrawDestinationChainIds(): UniverseChainId[] {
  return getChainedActionsSupportedChainIds()
}

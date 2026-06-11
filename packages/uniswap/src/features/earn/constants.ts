import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CHAINED_ACTIONS_SUPPORTED_CHAINS } from 'uniswap/src/features/transactions/swap/utils/chainedActions'

export const EARN_SUPPORTED_CHAIN_IDS = [UniverseChainId.Mainnet]
// Earn deposits route through chained actions, so source-chain support intentionally matches chained-action support.
export const EARN_DEPOSIT_SOURCE_SUPPORTED_CHAIN_IDS: UniverseChainId[] = CHAINED_ACTIONS_SUPPORTED_CHAINS
export const DEFAULT_WITHDRAW_CHAIN_ID: UniverseChainId = UniverseChainId.Mainnet
export const WITHDRAW_DESTINATION_CHAIN_IDS: UniverseChainId[] = CHAINED_ACTIONS_SUPPORTED_CHAINS

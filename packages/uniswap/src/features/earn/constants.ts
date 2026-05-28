import { UniverseChainId } from 'uniswap/src/features/chains/types'

export const EARN_SUPPORTED_CHAIN_IDS = [UniverseChainId.Mainnet]

// TODO(CONS-1787): drive from the chains supported by the withdraw quote endpoint.
export const DEFAULT_WITHDRAW_CHAIN_ID: UniverseChainId = UniverseChainId.Unichain
export const WITHDRAW_DESTINATION_CHAIN_IDS: UniverseChainId[] = [DEFAULT_WITHDRAW_CHAIN_ID, UniverseChainId.Mainnet]

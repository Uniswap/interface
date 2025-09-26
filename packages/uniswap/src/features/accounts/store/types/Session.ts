import type { UniverseChainIdByPlatform } from 'uniswap/src/features/chains/types'
import type { Platform } from 'uniswap/src/features/platforms/types/Platform'

/**
 * Defines the chain context scope for a wallet session.
 * SingleChain: Wallets with a current chain concept (e.g. web dapp flows)
 * MultiChain: Wallets without current chain concept (e.g. wallet app flows)
 */
export enum ChainScopeType {
  SingleChain = 'SingleChain',
  MultiChain = 'MultiChain',
}

/**
 * Information about the current chain in a single-chain session.
 * Distinguishes between supported chains (with proper chain ID) and unsupported chains
 * that the wallet is connected to but our app doesn't recognize.
 */
export type CurrentChainInfo<SupportedPlatforms extends Platform> =
  | { supportedByApp: true; currentChainId: UniverseChainIdByPlatform<SupportedPlatforms> }
  | { supportedByApp: false; unsupportedChain: number }

interface BaseChainScope<SupportedPlatforms extends Platform> {
  type: ChainScopeType
  /** Provides information about which chains are supported: a limited `Set` of chains, or `all`. */
  supportedChains: Set<UniverseChainIdByPlatform<SupportedPlatforms>> | 'all'
}

/**
 * Maintains concept of current chain for transaction context and chain switching.
 */
export interface SingleChainScope<SupportedPlatforms extends Platform> extends BaseChainScope<SupportedPlatforms> {
  type: ChainScopeType.SingleChain
  currentChain: CurrentChainInfo<SupportedPlatforms>
}

/**
 * Represents scopes with no current chain concept - can make requests without switching chains.
 */
export interface MultiChainScope<SupportedPlatforms extends Platform> extends BaseChainScope<SupportedPlatforms> {
  type: ChainScopeType.MultiChain
}

export type ChainScope<SupportedPlatforms extends Platform> =
  | SingleChainScope<SupportedPlatforms>
  | MultiChainScope<SupportedPlatforms>

/**
 * Represents the active connection state when wallet communication is established.
 * Contains the active account selection and chain context for the connected wallet.
 * Only present when a connector is `Connected`, or in some edge cases `Connecting`.
 */
export interface Session<SupportedPlatforms extends Platform = Platform> {
  walletId: string
  currentAccountIndex: number
  chainScope: ChainScope<SupportedPlatforms>
}

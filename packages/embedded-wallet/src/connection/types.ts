import type { GetCapabilitiesCore } from '@universe/embedded-wallet/src/connection/eip5792Types'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { PublicClient } from 'viem'

export type Listener = (payload: any) => void

/**
 * Resolves a viem `PublicClient` for a given chain. Injected at the boundary
 * (see web's `embeddedWalletProviderInstance.ts`) — the provider never reaches
 * for a module-scoped singleton, so the dependency is visible at the constructor
 * signature and trivially stubbable in tests.
 */
export type GetViemClient = (chainId: UniverseChainId) => PublicClient

export interface EmbeddedWalletProviderDeps {
  getViemClient: GetViemClient
  /**
   * Chain capability derivation for EIP-5792 `wallet_getCapabilities`. Injected by
   * the app because the implementation lives in `wallet` (which depends on this
   * package, so this package cannot import it back).
   */
  getCapabilitiesCore: GetCapabilitiesCore
}

/**
 * The provider surface consumers interact with (wagmi connector, composition root).
 * The concrete class lives in the web platform file.
 */
export interface EmbeddedWalletProviderApi {
  request(args: { method: string; params?: any[] }): Promise<any>
  on(event: string, listener: Listener): void
  off(event: string, listener: Listener): void
  removeListener(event: string, listener: Listener): void
  emit(event: string, payload: any): void
  connect(chainId?: number): void
  disconnect(error: any): void
  getChainId(): number
}

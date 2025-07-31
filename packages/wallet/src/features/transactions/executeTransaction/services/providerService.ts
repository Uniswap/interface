import type { providers } from 'ethers'
import type { AccountMeta } from 'uniswap/src/features/accounts/types'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'

export type Provider = providers.JsonRpcProvider

/**
 * Service for managing blockchain providers
 * Abstracts the creation and selection of appropriate providers
 */
export interface ProviderService {
  /**
   * Get a provider for the specified blockchain
   * @param chainId The blockchain chain ID
   * @returns A provider instance
   */
  getProvider(input: { chainId: UniverseChainId }): Promise<Provider>

  /**
   * Get a private RPC provider for the specified blockchain and account
   * @param chainId The blockchain chain ID
   * @param account The account metadata
   * @returns A private provider instance
   */
  getPrivateProvider(input: { chainId: UniverseChainId; account: AccountMeta }): Promise<Provider>
}

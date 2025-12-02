/**
 * Uniswap Identifier provider interface
 * Platform-specific implementations handle uniswap identifier persistence
 */
interface UniswapIdentifierService {
  getUniswapIdentifier(): Promise<string | null>
  setUniswapIdentifier(identifier: string): Promise<void>
  removeUniswapIdentifier(): Promise<void>
}

export type { UniswapIdentifierService }

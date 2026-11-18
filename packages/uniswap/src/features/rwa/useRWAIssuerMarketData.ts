import { normalizeTokenAddressForCache } from '@universe/chains'
import type { RestContract } from 'uniswap/src/features/dataApi/types'

export type RWAIssuerMarketData = {
  priceUsd?: number
  marketCapUsd?: number
  volume24hUsd?: number
}

// EVM addresses come back checksummed or lowercased from the backend; normalize so lookups match.
// Solana addresses are case-sensitive and pass through unchanged.
export function rwaTokenMarketDataKey({ chainId, address }: RestContract): string {
  return `${chainId}-${normalizeTokenAddressForCache(address)}`
}

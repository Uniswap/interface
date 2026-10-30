import { DynamicConfigs, useDynamicConfigValue, VerifiedAuctionsConfigKey } from '@universe/gating'
import { DEFAULT_VERIFIED_AUCTION_IDS } from 'uniswap/src/features/toucan/auctionMetadata'

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
}

/**
 * Verified auction ids ("{chainId}_{checksummed auction address}") from the Statsig `verified_auctions`
 * config. Every surface reads through here so the auction page, Explore, search and top auctions agree,
 * including when Statsig can't be read and the default list applies.
 */
export function useVerifiedAuctionIds(): string[] {
  return useDynamicConfigValue({
    config: DynamicConfigs.VerifiedAuctions,
    key: VerifiedAuctionsConfigKey.VerifiedAuctionIds,
    defaultValue: DEFAULT_VERIFIED_AUCTION_IDS,
    customTypeGuard: isStringArray,
  })
}

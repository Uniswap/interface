import { QUICK_LAUNCH_TOTAL_SUPPLY_RAW } from '@uniswap/liquidity-launcher-sdk'
import { calculateCappedMaxBidQ96, fdvToPriceQ96, quickLaunchMaxBidFdv } from '@universe/cca'

/** A quick launch raises in the chain's native currency, which is 18 decimals on every EVM chain. */
const NATIVE_DECIMALS = 18n

/**
 * The quick-launch product ceiling as a Q96 price per token base unit: the chain's quick-launch FDV
 * (`quickLaunchMaxBidFdv`, in whole native units) spread across the preset's fixed total supply
 * (1e27 raw — the SDK's `isQuickLaunch` classifier only matches auctions minted with exactly that
 * supply). 25,000 ETH → 2^96 / 40,000; Arc's 50,000,000 USDC → 2^96 / 20.
 */
export function quickLaunchMaxBidCapQ96(chainId: number): bigint {
  return fdvToPriceQ96({
    fdvRaw: quickLaunchMaxBidFdv(chainId) * 10n ** NATIVE_DECIMALS,
    totalSupplyRaw: QUICK_LAUNCH_TOTAL_SUPPLY_RAW,
  })
}

/**
 * The `maxPrice` (Q96) for a quick-launch bid: {@link quickLaunchMaxBidCapQ96} for the auction's
 * chain, snapped DOWN to its tick grid and never below the contract minimum (`calculateCappedMaxBidQ96`,
 * shared with apps/pools-xyz). Quick launches have no max-FDV input; the uniform-price mechanism
 * caps spend at the budget, and this is the reservation price the bid stays active up to.
 *
 * Throws on a non-positive tick size or a negative price — there is no grid to bid on.
 */
export function calculateQuickLaunchMaxBidQ96({
  chainId,
  clearingPriceQ96,
  floorPriceQ96,
  tickSizeQ96,
}: {
  /** The AUCTION's chain — the cap is denominated in that chain's native currency. */
  chainId: number
  clearingPriceQ96: bigint
  floorPriceQ96: bigint
  tickSizeQ96: bigint
}): bigint {
  return calculateCappedMaxBidQ96({
    capQ96: quickLaunchMaxBidCapQ96(chainId),
    clearingPriceQ96,
    floorPriceQ96,
    tickSizeQ96,
  })
}

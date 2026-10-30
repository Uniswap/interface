const ARC_CHAIN_ID = 5042

/**
 * The fully diluted valuation a quick-launch ("join at market") bid stays active up to, in whole
 * units of the chain's native currency — what a quick launch raises in. Pinned in that currency
 * rather than converted from USD at bid time, and not a multiple of the current price: clearing can
 * rise past any fixed multiple during the window, silently dropping the bid.
 *
 * 25,000 is the ETH figure (≈$50M FDV). Arc raises in native USDC, where 25,000 would be a $25k
 * FDV — a valuation a healthy launch clears early, after which every new market bid goes in one
 * tick above clearing and is outbid almost at once — so Arc carries its own 50,000,000 USDC
 * (product decision, 2026-09-03). Chains whose native currency is neither ETH nor USDC (Avalanche,
 * X Layer) have no product figure yet and carry the ETH one.
 */
export function quickLaunchMaxBidFdv(chainId: number): bigint {
  return chainId === ARC_CHAIN_ID ? 50_000_000n : 25_000n
}

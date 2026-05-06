/**
 * Computes simulation results using an average-price model.
 *
 * The bidder participates while the auction price is below their maxTokenPrice.
 * Budget is spread proportionally across the active fraction of the auction,
 * and tokens received = budgetSpent / averagePrice during that window.
 *
 * @param currentPrice - The price point to evaluate at (use maxTokenPrice for final summary)
 * @param maxTokenPrice - Bidder's max price threshold
 * @param floorPrice - Auction floor price
 * @param expectedFinalPrice - Projected final auction price
 * @param budget - Total budget
 * @returns fractionActive (0–1), budgetSpent, and tokensReceived (decimal, not raw)
 */
export function computeSimulationResult({
  currentPrice,
  maxTokenPrice,
  floorPrice,
  expectedFinalPrice,
  budget,
}: {
  currentPrice: number
  maxTokenPrice: number
  floorPrice: number
  expectedFinalPrice: number
  budget: number
}): { fractionActive: number; budgetSpent: number; tokensReceived: number } {
  const priceRange = expectedFinalPrice - floorPrice
  if (budget <= 0 || maxTokenPrice <= 0 || priceRange <= 0) {
    return { fractionActive: 0, budgetSpent: 0, tokensReceived: 0 }
  }

  const isOutbid = currentPrice > maxTokenPrice

  // Price cap for the active window
  const effectivePrice = isOutbid ? maxTokenPrice : currentPrice
  const fractionActive = Math.min(1, Math.max(0, (effectivePrice - floorPrice) / priceRange))
  const budgetSpent = budget * fractionActive
  // Simplified linear average — the chart curve uses MPS-weighted pricing which is
  // non-linear across steps, so token estimates here are approximate. Fine for an
  // educational simulation; not suitable for exact bidding calculations.
  const avgPrice = (floorPrice + effectivePrice) / 2

  const tokensReceived = avgPrice > 0 ? budgetSpent / avgPrice : 0

  return { fractionActive, budgetSpent, tokensReceived }
}

import type { PortfolioMultichainBalance } from 'uniswap/src/features/dataApi/types'

/**
 * Token quantity shown in portfolio rows (e.g. mobile hidden tokens list).
 * Sums per-chain amounts so we match the web portfolio table and avoid showing 0 when
 * the API sets `totalAmount` to 0 but individual `tokens[].quantity` values are non-zero.
 */
export function getPortfolioBalanceDisplayQuantity(
  portfolioBalance: PortfolioMultichainBalance | undefined,
): number | undefined {
  if (!portfolioBalance) {
    return undefined
  }

  const quantityFromTokens = portfolioBalance.tokens.reduce((sum, token) => sum + token.quantity, 0)
  if (quantityFromTokens > 0) {
    return quantityFromTokens
  }

  return portfolioBalance.totalAmount
}

import { GetPortfolioResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import {
  type Balance,
  ChainBalance,
  MultichainBalance,
  Portfolio,
} from '@uniswap/client-data-api/dist/data/v1/types_pb'

/**
 * Transforms a GetPortfolio response that uses the legacy `portfolio.balances`
 * shape into the new `portfolio.multichainBalances` shape.
 *
 * For the legacy API, each balance is a single token on a single chain, so each
 * balance becomes one MultichainBalance with exactly one ChainBalance (the
 * "tokens array will always be 1 in length").
 */
export function transformPortfolioToMultichain(
  response: GetPortfolioResponse | undefined,
): GetPortfolioResponse | undefined {
  if (!response?.portfolio || response.portfolio.balances.length === 0) {
    return response
  }

  const portfolio = response.portfolio
  const multichainBalances = portfolio.balances.map((balance): MultichainBalance => balanceToMultichainBalance(balance))

  const transformedPortfolio = new Portfolio({
    totalValueUsd: portfolio.totalValueUsd,
    totalValueAbsoluteChange1d: portfolio.totalValueAbsoluteChange1d,
    totalValuePercentChange1d: portfolio.totalValuePercentChange1d,
    multichainBalances,
    balances: [], // Normalize to new shape only
  })

  return new GetPortfolioResponse({ portfolio: transformedPortfolio })
}

function balanceToMultichainBalance(balance: Balance): MultichainBalance {
  const token = balance.token
  const metadata = token?.metadata
  const amount = balance.amount

  const chainBalance = new ChainBalance({
    chainId: token?.chainId ?? 0,
    address: token?.address ?? '',
    decimals: token?.decimals ?? 0,
    amount,
    valueUsd: balance.valueUsd,
  })

  return new MultichainBalance({
    name: token?.name ?? '',
    symbol: token?.symbol ?? '',
    type: token?.type ?? 0,
    projectName: metadata?.projectName ?? '',
    logoUrl: metadata?.logoUrl ?? '',
    protectionInfo: metadata?.protectionInfo,
    feeData: metadata?.feeData,
    safetyLevel: metadata?.safetyLevel ?? 0,
    spamCode: metadata?.spamCode ?? 0,
    totalAmount: amount,
    priceUsd: balance.priceUsd,
    pricePercentChange1d: balance.pricePercentChange1d,
    totalValueUsd: balance.valueUsd,
    isHidden: balance.isHidden,
    chainBalances: [chainBalance],
  })
}

/**
 * Returns true when the portfolio response uses the legacy balances shape and
 * should be transformed to multichainBalances.
 */
export function shouldTransformToMultichain(response: GetPortfolioResponse | undefined): boolean {
  if (!response?.portfolio) {
    return false
  }
  const p = response.portfolio
  const hasLegacyBalances = p.balances.length > 0
  const hasMultichainBalances = p.multichainBalances.length > 0
  return hasLegacyBalances && !hasMultichainBalances
}

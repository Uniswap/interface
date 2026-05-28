import isEqual from 'lodash/isEqual'
import { BaseResult, PortfolioBalance } from 'uniswap/src/features/dataApi/types'

export type PortfolioTotalValue = {
  balanceUSD: number | undefined
  percentChange: number | undefined
  absoluteChangeUSD: number | undefined
}

export type PortfolioTotalValueResult = BaseResult<PortfolioTotalValue>

export type PortfolioCacheUpdater = (hidden: boolean, portfolioBalance?: PortfolioBalance) => void

const PORTFOLIO_BALANCE_CACHE = new Map<string, PortfolioBalance>()

export function buildPortfolioBalance(args: PortfolioBalance): PortfolioBalance {
  const cachedPortfolioBalance = PORTFOLIO_BALANCE_CACHE.get(args.cacheId)

  if (cachedPortfolioBalance && isEqual(cachedPortfolioBalance, args)) {
    // This allows us to better memoize components that use a `portfolioBalance` as a dependency.
    return cachedPortfolioBalance
  }

  PORTFOLIO_BALANCE_CACHE.set(args.cacheId, args)
  return args
}

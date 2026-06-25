import { GetPortfolioResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { logger } from 'utilities/src/logger/logger'

/**
 * Computes the total balances in USD per chain for telemetry purposes
 */
export function calculateTotalBalancesUsdPerChainRest(
  portfolioData: GetPortfolioResponse | undefined,
): Record<string, number> | undefined {
  if (!portfolioData?.portfolio?.balances) {
    return undefined
  }

  try {
    return portfolioData.portfolio.balances.reduce((balancesByChain: Record<string, number>, balance) => {
      if (!balance.token) {
        return balancesByChain
      }

      const chainId = balance.token.chainId
      // using capitalized chain name to keep data consistent with legacy gql endpoint
      const chainName = getChainInfo(chainId).label.toUpperCase()
      const balanceUsd = balance.valueUsd

      balancesByChain[chainName] = (balancesByChain[chainName] ?? 0) + balanceUsd
      return balancesByChain
    }, {})
  } catch (error) {
    logger.error(error, {
      tags: { file: 'balances/utils', function: 'calculateTotalBalancesUsdPerChainRest' },
    })
    return undefined
  }
}

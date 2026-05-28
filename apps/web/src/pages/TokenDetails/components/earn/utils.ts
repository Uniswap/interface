import { computeAggregateBalance } from 'uniswap/src/components/tokenDetails/utils'
import type { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import type { MultiChainMap } from '~/pages/TokenDetails/context/TDPContext'

export function getAggregateTokenBalance(multiChainMap: MultiChainMap): PortfolioBalance | undefined {
  const balances: PortfolioBalance[] = []

  Object.values(multiChainMap).forEach((entry) => {
    if (entry.balance) {
      balances.push(entry.balance)
    }
  })

  return computeAggregateBalance(balances, balances[0]?.currencyInfo)
}

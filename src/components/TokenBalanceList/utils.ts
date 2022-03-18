import { ALL_SUPPORTED_CHAIN_IDS, ChainId } from 'src/constants/chains'
import { ChainIdToCurrencyIdToPortfolioBalance, PortfolioBalance } from 'src/features/dataApi/types'

/** Convert balances into array suitable for SectionList */
export function balancesToSectionListData(balances: ChainIdToCurrencyIdToPortfolioBalance): {
  chainId: ChainId
  data: PortfolioBalance[]
}[] {
  const chainIdToCurrencyAmounts = ALL_SUPPORTED_CHAIN_IDS.reduce<
    {
      chainId: ChainId
      data: PortfolioBalance[]
    }[]
  >((acc, chainId) => {
    if (balances[chainId]) {
      const nonzeroBalances = Object.values(balances[chainId]!)
        .filter(({ amount }: PortfolioBalance) => !!amount?.greaterThan(0))
        .sort((a, b) => (a.balanceUSD > b.balanceUSD ? -1 : 1))

      if (nonzeroBalances.length > 0) {
        acc.push({
          chainId: chainId,
          data: nonzeroBalances,
        })
      }
    }

    return acc
  }, [])

  return chainIdToCurrencyAmounts
}

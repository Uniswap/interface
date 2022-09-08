import { ALL_SUPPORTED_CHAIN_IDS, ChainId } from 'src/constants/chains'
import { PortfolioBalance } from 'src/features/dataApi/types'

/** Convert balances into array suitable for SectionList */
export function balancesToSectionListData(balances: PortfolioBalance[]): {
  chainId: ChainId
  data: PortfolioBalance[]
}[] {
  return ALL_SUPPORTED_CHAIN_IDS.map((chainId: ChainId) => {
    const balancesOnChain = balances
      .filter((balance) => balance.currencyInfo.currency.chainId === chainId)
      .sort((a, b) => (a.balanceUSD > b.balanceUSD ? -1 : 1))

    return balancesOnChain.length
      ? {
          chainId,
          data: balancesOnChain,
        }
      : null
  }).filter(Boolean) as {
    chainId: ChainId
    data: PortfolioBalance[]
  }[]
}

import { useAccount } from 'hooks/useAccount'
import { useMemo } from 'react'
import { useSortedPortfolioBalances } from 'uniswap/src/features/dataApi/balances/balances'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

export interface TokenData {
  id: string
  currencyInfo: CurrencyInfo | null // Full currency info including logoUrl
  price: string
  change1d: number | undefined
  balance: {
    value: string
    symbol: string | undefined
  }
  value: string
  rawValue: Maybe<number>
  allocation: number
}

// Custom hook to format portfolio data
export function useTransformTokenTableData(): TokenData[] {
  const account = useAccount()
  const { data: portfolioData, loading } = useSortedPortfolioBalances({
    evmAddress: account.address || undefined,
  })
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()

  return useMemo(() => {
    if (!account.address || !portfolioData?.balances || loading) {
      return []
    }

    // Compute total USD across visible balances to determine allocation per token
    const totalUSD = portfolioData.balances.reduce((sum, b) => sum + (b.balanceUSD ?? 0), 0)

    return portfolioData.balances.map((balance) => {
      // Format price (using balanceUSD / quantity for now, could be improved with actual price data)
      const price =
        balance.balanceUSD && balance.quantity > 0
          ? convertFiatAmountFormatted(balance.balanceUSD / balance.quantity, NumberType.FiatTokenPrice)
          : '$0.00'

      // Format balance quantity
      const formattedBalance = formatNumberOrString({
        value: balance.quantity,
        type: NumberType.TokenNonTx,
      })

      // Format USD value
      const value = convertFiatAmountFormatted(balance.balanceUSD, NumberType.PortfolioBalance)

      // Allocation percentage of this token vs total portfolio USD (0..100)
      const balanceUSD = balance.balanceUSD ?? 0
      const allocation = totalUSD > 0 ? (balanceUSD / totalUSD) * 100 : 0

      return {
        id: balance.id,
        currencyInfo: balance.currencyInfo,
        price,
        change1d: balance.relativeChange24 || undefined,
        balance: {
          value: formattedBalance,
          symbol: balance.currencyInfo.currency.symbol,
        },
        value,
        rawValue: balance.balanceUSD,
        allocation,
      }
    })
  }, [account.address, portfolioData?.balances, loading, convertFiatAmountFormatted, formatNumberOrString])
}

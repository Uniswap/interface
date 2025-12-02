import { NetworkStatus } from '@apollo/client'
import { usePortfolioAddress } from 'pages/Portfolio/hooks/usePortfolioAddress'
import { useMemo } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useSortedPortfolioBalances } from 'uniswap/src/features/dataApi/balances/balances'
import type { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
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
export function useTransformTokenTableData({ chainIds }: { chainIds?: UniverseChainId[] }): {
  visible: TokenData[] | null
  hidden: TokenData[] | null
  loading: boolean
  refetching: boolean
  error: Error | undefined
  refetch: (() => void) | undefined
  networkStatus: NetworkStatus
} {
  const portfolioAddress = usePortfolioAddress()
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()

  const {
    data: sortedBalances,
    loading,
    error,
    refetch,
    networkStatus,
  } = useSortedPortfolioBalances({
    evmAddress: portfolioAddress,
    chainIds,
  })

  return useMemo(() => {
    // Only show empty state on initial load, not during refetch
    const isInitialLoading = loading && !sortedBalances
    const isRefetching = loading && !!sortedBalances

    if (isInitialLoading) {
      return { visible: null, hidden: null, loading, refetching: false, error, refetch, networkStatus }
    }

    if (!sortedBalances) {
      return { visible: [], hidden: [], loading, refetching: false, error, refetch, networkStatus }
    }

    // Compute total USD across visible balances to determine allocation per token
    const totalUSDVisible = sortedBalances.balances.reduce((sum, b) => sum + (b.balanceUSD ?? 0), 0)

    const mapBalanceToTokenData = (balance: PortfolioBalance, allocationFromTotal?: number): TokenData => {
      const price =
        balance.balanceUSD && balance.quantity > 0
          ? convertFiatAmountFormatted(balance.balanceUSD / balance.quantity, NumberType.FiatTokenPrice)
          : '$0.00'

      const formattedBalance = formatNumberOrString({ value: balance.quantity, type: NumberType.TokenNonTx })
      const value = convertFiatAmountFormatted(balance.balanceUSD, NumberType.PortfolioBalance)

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
        allocation: allocationFromTotal ?? 0,
      }
    }

    const visible = sortedBalances.balances.map((b) => {
      const balanceUSD = b.balanceUSD ?? 0
      const allocation = totalUSDVisible > 0 ? (balanceUSD / totalUSDVisible) * 100 : 0
      return mapBalanceToTokenData(b, allocation)
    })

    const hidden = sortedBalances.hiddenBalances.map((b) => mapBalanceToTokenData(b, 0))

    return { visible, hidden, loading, refetching: isRefetching, refetch, networkStatus, error }
  }, [loading, sortedBalances, convertFiatAmountFormatted, formatNumberOrString, error, refetch, networkStatus])
}

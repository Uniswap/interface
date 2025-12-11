import { NetworkStatus } from '@apollo/client'
import { usePortfolioAddresses } from 'pages/Portfolio/hooks/usePortfolioAddresses'
import { useMemo } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useSortedPortfolioBalances } from 'uniswap/src/features/dataApi/balances/balances'
import type { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'

export interface TokenData {
  id: string
  currencyInfo: CurrencyInfo | null // Full currency info including logoUrl
  price: number
  change1d: number | undefined
  balance: {
    value: number
    symbol: string | undefined
  }
  value: number
  allocation: number
  isHidden: boolean | null | undefined
}

// Custom hook to format portfolio data
export function useTransformTokenTableData({ chainIds, limit }: { chainIds?: UniverseChainId[]; limit?: number }): {
  visible: TokenData[] | null
  hidden: TokenData[] | null
  totalCount: number | null
  loading: boolean
  refetching: boolean
  error: Error | undefined
  refetch: (() => void) | undefined
  networkStatus: NetworkStatus
} {
  const { evmAddress, svmAddress } = usePortfolioAddresses()

  const {
    data: sortedBalances,
    loading,
    error,
    refetch,
    networkStatus,
  } = useSortedPortfolioBalances({
    evmAddress,
    svmAddress,
    chainIds,
  })

  return useMemo(() => {
    // Only show empty state on initial load, not during refetch
    const isInitialLoading = loading && !sortedBalances
    const isRefetching = loading && !!sortedBalances

    if (isInitialLoading) {
      return {
        visible: null,
        hidden: null,
        totalCount: null,
        loading,
        refetching: false,
        error,
        refetch,
        networkStatus,
      }
    }

    if (!sortedBalances) {
      return { visible: [], hidden: [], totalCount: 0, loading, refetching: false, error, refetch, networkStatus }
    }

    // Compute total USD across visible balances to determine allocation per token
    const totalUSDVisible = sortedBalances.balances.reduce((sum, b) => sum + (b.balanceUSD ?? 0), 0)

    const mapBalanceToTokenData = (balance: PortfolioBalance, allocationFromTotal?: number): TokenData => {
      const balanceUSD = balance.balanceUSD ?? 0
      const priceRaw = balanceUSD > 0 && balance.quantity > 0 ? balanceUSD / balance.quantity : 0

      return {
        id: balance.id,
        currencyInfo: balance.currencyInfo,
        price: priceRaw,
        change1d: balance.relativeChange24 || undefined,
        balance: {
          value: balance.quantity,
          symbol: balance.currencyInfo.currency.symbol,
        },
        value: balanceUSD,
        allocation: allocationFromTotal ?? 0,
        isHidden: balance.isHidden,
      }
    }

    const visible = sortedBalances.balances.map((b) => {
      const balanceUSD = b.balanceUSD ?? 0
      const allocation = totalUSDVisible > 0 ? (balanceUSD / totalUSDVisible) * 100 : 0
      return mapBalanceToTokenData(b, allocation)
    })

    const hidden = sortedBalances.hiddenBalances.map((b) => mapBalanceToTokenData(b, 0))

    // Apply limit to visible tokens if specified
    const limitedVisible = limit ? visible.slice(0, limit) : visible
    const totalCount = visible.length

    return {
      visible: limitedVisible,
      hidden,
      totalCount,
      loading,
      refetching: isRefetching,
      refetch,
      networkStatus,
      error,
    }
  }, [loading, sortedBalances, error, refetch, networkStatus, limit])
}

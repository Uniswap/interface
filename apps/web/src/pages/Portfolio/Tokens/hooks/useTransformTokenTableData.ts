import { NetworkStatus } from '@apollo/client'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useSortedPortfolioBalancesMultichain } from 'uniswap/src/features/dataApi/balances/balances'
import type { PortfolioMultichainBalance } from 'uniswap/src/features/dataApi/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { usePortfolioAddresses } from '~/pages/Portfolio/hooks/usePortfolioAddresses'

/** Per-chain token instance (use TokenData['tokens'][number] in other modules) */
interface TokenDataToken {
  chainId: number
  currencyInfo: CurrencyInfo
  quantity: number
  valueUsd: number
  symbol: string | undefined
}

export interface TokenData {
  id: string
  testId: string
  chainId: number
  currencyInfo: CurrencyInfo
  quantity: number
  symbol: string | undefined
  price: number | undefined
  change1d: number | undefined
  tokens: TokenDataToken[]
  totalValue: number
  allocation: number
  isHidden: boolean | null | undefined
}

// Custom hook to format portfolio data
// When flag OFF: do not request multichain from backend → backend returns legacy → we transform to multichain shape for the table.
// When flag ON: request multichain from backend → backend returns portfolio.multichainBalances → no transform needed.
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
  const isMultichainTokenUx = useFeatureFlag(FeatureFlags.MultichainTokenUx)

  const {
    data: sortedBalances,
    loading,
    error,
    refetch,
    networkStatus,
  } = useSortedPortfolioBalancesMultichain({
    evmAddress,
    svmAddress,
    chainIds,
    // Flag OFF: legacy data from backend, transform to multichain shape on client. Flag ON: multichain (mock) data from backend.
    requestMultichainFromBackend: isMultichainTokenUx,
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

    const balancesWithTokens = (b: PortfolioMultichainBalance) => b.tokens.length > 0
    const visibleBalances = sortedBalances.balances.filter(balancesWithTokens)
    const hiddenBalancesFiltered = sortedBalances.hiddenBalances.filter(balancesWithTokens)

    // Compute total USD across visible balances (with at least one token) for allocation
    const totalUSDVisible = visibleBalances.reduce((sum, b) => sum + (b.totalValueUsd ?? b.tokens[0]?.valueUsd ?? 0), 0)

    const mapBalanceToTokenData = (
      balance: PortfolioMultichainBalance,
      allocationFromTotal?: number,
    ): TokenData | null => {
      const tokens: TokenData['tokens'] = balance.tokens.map((t) => ({
        chainId: t.chainId,
        currencyInfo: t.currencyInfo,
        quantity: t.quantity,
        valueUsd: t.valueUsd ?? 0,
        symbol: t.currencyInfo.currency.symbol,
      }))
      const first = tokens[0]
      // useTransformTokenTableData already ensures that there is at least one token, but adding check for safety
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!first) {
        throw new Error('Invariant violation: tokens array is empty after filtering')
      }
      const totalValue = balance.totalValueUsd ?? first.valueUsd
      const price =
        first.valueUsd > 0 && first.quantity > 0 ? first.valueUsd / first.quantity : (balance.priceUsd ?? undefined)
      return {
        id: balance.id,
        testId: `${TestID.TokenTableRowPrefix}${balance.id}`,
        chainId: first.chainId,
        currencyInfo: first.currencyInfo,
        quantity: first.quantity,
        symbol: first.symbol,
        price,
        tokens,
        totalValue,
        allocation: allocationFromTotal ?? 0,
        change1d: balance.pricePercentChange1d ?? undefined,
        isHidden: balance.isHidden,
      }
    }

    const visible = visibleBalances
      .map((b) => {
        const valueUSD = b.totalValueUsd ?? b.tokens[0]?.valueUsd ?? 0
        const allocation = totalUSDVisible > 0 ? (valueUSD / totalUSDVisible) * 100 : 0
        return mapBalanceToTokenData(b, allocation)
      })
      .filter((d): d is TokenData => d !== null)

    const hidden = hiddenBalancesFiltered
      .map((b) => mapBalanceToTokenData(b, 0))
      .filter((d): d is TokenData => d !== null)

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

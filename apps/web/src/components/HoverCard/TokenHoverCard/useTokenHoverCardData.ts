import { GraphQLApi } from '@universe/api'
import { useMemo } from 'react'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { getPortfolioChartPercentChange } from 'uniswap/src/features/portfolio/portfolioChartPercentChange'
import { useCurrencyInfoWithLoading } from 'uniswap/src/features/tokens/useCurrencyInfo'
import type { PriceChartData } from '~/components/Charts/PriceChart'
import { PriceChartType } from '~/components/Charts/utils'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { useTokenPriceChartData } from '~/hooks/useTokenPriceChartData'
import { getNativeTokenDBAddress } from '~/utils/nativeTokens'

/**
 * Resolves the card's CurrencyInfo (deferred until first open on the `token` path) and the 1D price
 * chart that depends on it. The visible trigger renders entirely from row/prop data, so nothing here
 * is needed before the popover opens.
 */
export function useTokenHoverCardData({
  currencyInfoProp,
  currencyIdFromToken,
  gqlChain,
  rawAddress,
  hasOpenIntent,
  isOpen,
}: {
  currencyInfoProp?: CurrencyInfo
  currencyIdFromToken?: string
  gqlChain: GraphQLApi.Chain
  rawAddress?: string
  hasOpenIntent: boolean
  isOpen: boolean
}): {
  currencyInfo: Maybe<CurrencyInfo>
  currencyInfoUnavailable: boolean
  isMultichainAsset: boolean
  entries: PriceChartData[]
  chartLoading: boolean
  price?: number
  pricePercentChange?: number
  priceAbsoluteChange?: number
} {
  // Only fetch currencyInfo when using the token prop path (and only once the card is actually
  // hovered open); use the prop directly otherwise.
  const { data: derivedCurrencyInfo, isLoading: currencyInfoLoading } = useCurrencyInfoWithLoading(
    currencyInfoProp || !hasOpenIntent ? undefined : currencyIdFromToken,
  )
  const currencyInfo = currencyInfoProp ?? derivedCurrencyInfo

  // True once the deferred fetch has settled with nothing (unknown/spam token) — stops the chart
  // query and switches the placeholder to its no-data state, since no token data will ever arrive.
  const currencyInfoUnavailable = hasOpenIntent && !currencyInfo && !currencyInfoLoading

  // An asset is multichain when it has more than one on-chain deployment
  const isMultichainAsset = (currencyInfo?.searchMultichainParent?.tokenCurrencyIds.length ?? 0) > 1

  // NATIVE_CHAIN_ID is a frontend sentinel — the backend expects undefined (not 'NATIVE') for native-token price queries
  const tokenAddress = !rawAddress || rawAddress === NATIVE_CHAIN_ID ? getNativeTokenDBAddress(gqlChain) : rawAddress

  const variables = useMemo(
    () => ({
      chain: gqlChain,
      address: tokenAddress,
      duration: HistoryDuration.Day,
      multichain: isMultichainAsset,
    }),
    [gqlChain, tokenAddress, isMultichainAsset],
  )

  // Hold the chart until currencyInfo settles: `variables.multichain` derives from it, so
  // fetching earlier would issue the chart query with multichain=false and refire once the
  // token resolves as multichain.
  const isCurrencyInfoPending = !currencyInfo && currencyInfoLoading
  const { entries, loading: chartLoading } = useTokenPriceChartData({
    variables,
    skip: !isOpen || isCurrencyInfoPending || currencyInfoUnavailable,
    priceChartType: PriceChartType.LINE,
  })

  const price = entries.length > 0 ? entries[entries.length - 1].value : undefined

  const priceChange = useMemo(() => {
    const values = entries.map((entry) => entry.value)
    return getPortfolioChartPercentChange(values)
  }, [entries])

  const priceAbsoluteChange = useMemo(() => {
    if (priceChange?.absoluteChangeUSD != null) {
      return priceChange.absoluteChangeUSD
    }
    if (entries.length < 2) {
      return undefined
    }
    return entries[entries.length - 1].value - entries[0].value
  }, [priceChange, entries])

  return {
    currencyInfo,
    currencyInfoUnavailable,
    isMultichainAsset,
    entries,
    chartLoading,
    price,
    pricePercentChange: priceChange?.percentChange,
    priceAbsoluteChange,
  }
}

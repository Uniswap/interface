import type { Currency } from '@uniswap/sdk-core'
import { useLayoutEffect, useMemo } from 'react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useIsV2TokensEnabled } from 'uniswap/src/features/dataApi/tokenDetails/useIsV2TokensEnabled'
import {
  resolveSpotPriceOverride,
  useTokenPriceChange,
  useTokenSpotPrice,
} from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { usePreferProjectMarketDataForCurrency } from 'uniswap/src/features/rwa/usePreferProjectMarketData'
import { buildCurrencyId, currencyId } from 'uniswap/src/utils/currencyId'
import { DataQuality, PriceChartType } from '~/components/Charts/utils'
import { TimePeriod } from '~/data/util'
import { useTokenPriceChartData } from '~/hooks/useTokenPriceChartData'
import { getDisplayedPricePercentChange, type TokenPriceChartQueryVariables } from '~/hooks/useTokenPriceChartData'

export interface UseTokenPriceChartPanelParams {
  variables: TokenPriceChartQueryVariables
  priceChartType: PriceChartType
  timePeriod: TimePeriod
  currency: Currency
  setDisableCandlestickUI?: (disable: boolean) => void
  skip?: boolean
  /** When omitted, derives RWA preference from the chart currency (no TDP store required). */
  preferProjectMarketData?: boolean
  /** Disables this hook's own 30s price polling. Pass true where a page heartbeat owns the price cadence (TDP); leave off on surfaces without one (swap slideout). */
  disablePricePolling?: boolean
}

export function useTokenPriceChartPanel({
  variables,
  priceChartType,
  setDisableCandlestickUI,
  timePeriod,
  currency,
  skip = false,
  preferProjectMarketData: preferProjectMarketDataOverride,
  disablePricePolling = false,
}: UseTokenPriceChartPanelParams): {
  priceQuery: ReturnType<typeof useTokenPriceChartData>
  pricePercentChange: number | undefined
  showInvalidSkeleton: boolean
  stale: boolean
} {
  const chainId = useMemo(() => fromGraphQLChain(variables.chain), [variables.chain])
  const spotCurrencyId = useMemo(() => {
    if (!variables.address) {
      return undefined
    }
    return chainId ? buildCurrencyId(chainId, variables.address) : undefined
  }, [chainId, variables.address])
  const defaultPreferProjectMarketData = usePreferProjectMarketDataForCurrency(currency)
  const preferProjectMarketData = preferProjectMarketDataOverride ?? defaultPreferProjectMarketData
  const isV2TokensEnabled = useIsV2TokensEnabled()
  const spotPriceOverride = useTokenSpotPrice(spotCurrencyId, {
    preferProjectMarketData,
    isMultichainAggregateView: variables.multichain,
    // The V2 spot price must poll or the displayed price would freeze — REST token queries have no built-in polling
    refetchInterval: disablePricePolling ? undefined : PollingInterval.KindaFast,
    skip,
  })
  const currentPriceOverride = resolveSpotPriceOverride({
    isV2TokensEnabled,
    isMultichainAggregateView: variables.multichain,
    preferProjectMarketData,
    spotPrice: spotPriceOverride,
  })

  const priceQuery = useTokenPriceChartData({
    variables,
    skip,
    priceChartType,
    currentPriceOverride,
    preferProjectMarketData,
    disablePricePolling,
  })

  useLayoutEffect(() => {
    setDisableCandlestickUI?.(priceQuery.disableCandlestickUI)
  }, [priceQuery.disableCandlestickUI, setDisableCandlestickUI])

  const currencyIdValue = useMemo(() => currencyId(currency), [currency])
  const priceChange24h = useTokenPriceChange(currencyIdValue, { preferProjectMarketData, skip })

  const pricePercentChange = useMemo(
    () =>
      getDisplayedPricePercentChange({
        timePeriod,
        priceChange24h,
        entries: priceQuery.entries,
      }),
    [timePeriod, priceChange24h, priceQuery.entries],
  )

  return {
    priceQuery,
    pricePercentChange,
    showInvalidSkeleton: priceQuery.dataQuality === DataQuality.INVALID,
    stale: priceQuery.dataQuality === DataQuality.STALE,
  }
}

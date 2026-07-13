import type { Currency } from '@uniswap/sdk-core'
import { useLayoutEffect, useMemo } from 'react'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useTokenPriceChange, useTokenSpotPrice } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { usePreferProjectMarketDataForCurrency } from 'uniswap/src/features/rwa/usePreferProjectMarketData'
import { buildCurrencyId, currencyId } from 'uniswap/src/utils/currencyId'
import { TimePeriod } from '~/appGraphql/data/util'
import { DataQuality, PriceChartType } from '~/components/Charts/utils'
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
}

export function useTokenPriceChartPanel({
  variables,
  priceChartType,
  setDisableCandlestickUI,
  timePeriod,
  currency,
  skip = false,
  preferProjectMarketData: preferProjectMarketDataOverride,
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
  const spotPriceOverride = useTokenSpotPrice(spotCurrencyId, { preferProjectMarketData })
  const currentPriceOverride = variables.multichain && !preferProjectMarketData ? undefined : spotPriceOverride

  const priceQuery = useTokenPriceChartData({
    variables,
    skip,
    priceChartType,
    currentPriceOverride,
    preferProjectMarketData,
  })

  useLayoutEffect(() => {
    setDisableCandlestickUI?.(priceQuery.disableCandlestickUI)
  }, [priceQuery.disableCandlestickUI, setDisableCandlestickUI])

  const currencyIdValue = useMemo(() => currencyId(currency), [currency])
  const priceChange24h = useTokenPriceChange(currencyIdValue)

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

import type { Currency } from '@uniswap/sdk-core'
import { useLayoutEffect, useMemo } from 'react'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useTokenPriceChange } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { useTokenSpotPrice } from 'uniswap/src/features/dataApi/tokenDetails/useTokenSpotPriceWrapper'
import { buildCurrencyId, currencyId } from 'uniswap/src/utils/currencyId'
import { TimePeriod } from '~/appGraphql/data/util'
import { DataQuality, PriceChartType } from '~/components/Charts/utils'
import { useTDPPriceChartData, type TDPChartQueryVariables } from '~/pages/TokenDetails/components/chart/hooks'
import { getDisplayedPricePercentChange } from '~/pages/TokenDetails/components/chart/tdpPriceChartPercentChange'

interface UseTDPPriceChartPanelParams {
  variables: TDPChartQueryVariables
  priceChartType: PriceChartType
  setDisableCandlestickUI: (disable: boolean) => void
  timePeriod: TimePeriod
  currency: Currency
}

export function useTDPPriceChartPanel({
  variables,
  priceChartType,
  setDisableCandlestickUI,
  timePeriod,
  currency,
}: UseTDPPriceChartPanelParams): {
  priceQuery: ReturnType<typeof useTDPPriceChartData>
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
  const spotPriceOverride = useTokenSpotPrice(spotCurrencyId)
  const currentPriceOverride = variables.multichain ? undefined : spotPriceOverride

  const priceQuery = useTDPPriceChartData({
    variables,
    skip: false,
    priceChartType,
    currentPriceOverride,
  })

  useLayoutEffect(() => {
    setDisableCandlestickUI(priceQuery.disableCandlestickUI)
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

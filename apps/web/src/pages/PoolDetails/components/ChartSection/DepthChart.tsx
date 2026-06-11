import { ProtocolVersion as RestProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, useSporeColors } from 'ui/src'
import { BIPS_BASE, ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { useGetPoolsByTokens } from 'uniswap/src/data/rest/getPools'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getStablecoinsForChain, isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { NumberType } from 'utilities/src/format/types'
import { ChartHeader } from '~/components/Charts/ChartHeader'
import { Chart } from '~/components/Charts/ChartModel'
import { ChartSkeleton } from '~/components/Charts/LoadingState'
import { PriceChartData } from '~/components/Charts/PriceChart'
import { PriceChartDelta } from '~/components/Charts/PriceChart/PriceChartDelta'
import { ChartType } from '~/components/Charts/utils'
import { SubscriptZeroPrice } from '~/components/SubscriptZeroPrice'
import { LoadingChart } from '~/features/Explore/chart/LoadingChart'
import { useLiquidityBarData } from '~/features/Liquidity/charts/LiquidityChart'
import { getTokenOrZeroAddress } from '~/features/Liquidity/utils/currency'
import { ChartPriceText, PriceDisplayContainer } from '~/pages/PoolDetails/components/ChartSection/ChartPriceDisplay'
import {
  buildDepthData,
  DepthPoint,
  getDisplayPair,
  getGapTime,
  toDisplayPrice,
} from '~/pages/PoolDetails/components/ChartSection/DepthChart.utils'
import {
  DepthChartModel,
  DepthChartZoomActions,
  TooltipUpdate,
} from '~/pages/PoolDetails/components/ChartSection/DepthChartModel'
import {
  DepthSideTooltipContent,
  DepthTooltipBody,
  TooltipShell,
} from '~/pages/PoolDetails/components/ChartSection/DepthChartTooltip'

export type { DepthChartZoomActions } from '~/pages/PoolDetails/components/ChartSection/DepthChartModel'

const PDP_CHART_HEIGHT_PX = 356

// Minimum real bars (excluding the active-tick anchor) required on EACH side of the active price
// before the depth chart is considered informative. Below this, render the standard chart-error
// skeleton instead of a sparse, misleading staircase.
export const MIN_DEPTH_BARS_PER_SIDE = 4

export function DepthChart({
  tokenA,
  tokenB,
  feeTier,
  isReversed,

  chainId,
  version,
  hooks,
  poolId,
  onZoomActionsReady,
  priceEntries,
}: {
  tokenA: Currency
  tokenB: Currency
  feeTier: FeeAmount
  isReversed: boolean

  chainId: UniverseChainId
  version: RestProtocolVersion
  hooks?: string
  poolId?: string
  onZoomActionsReady?: (actions: DepthChartZoomActions) => void
  priceEntries?: PriceChartData[]
}) {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const tokenADescriptor = tokenA.symbol ?? tokenA.name ?? t('common.tokenA')
  const tokenBDescriptor = tokenB.symbol ?? tokenB.name ?? t('common.tokenB')

  const [mirrorState, setMirrorState] = useState<TooltipUpdate | null>(null)
  const [gapState, setGapState] = useState<{ sell: TooltipUpdate; buy: TooltipUpdate } | null>(null)

  const { data: poolData } = useGetPoolsByTokens(
    {
      fee: feeTier,
      chainId,
      protocolVersions: [version],
      token0: getTokenOrZeroAddress(tokenA),
      token1: getTokenOrZeroAddress(tokenB),
      hooks: hooks ?? ZERO_ADDRESS,
    },
    true,
  )

  const sdkCurrencies = useMemo(() => ({ TOKEN0: tokenA, TOKEN1: tokenB }), [tokenA, tokenB])

  const { tickData, activeTick, loading } = useLiquidityBarData({
    sdkCurrencies,
    feeTier,
    isReversed,
    chainId,
    version,
    hooks,
    poolId,
    tickSpacing: poolData?.pools[0]?.tickSpacing,
  })

  const { sellData, buyData, midPrice } = useMemo(() => {
    if (!tickData?.barData || activeTick === undefined) {
      return { sellData: [], buyData: [], midPrice: 0 }
    }
    return buildDepthData({
      barData: tickData.barData,
      activeTick,
      feeTier,
      token0Decimals: tokenA.decimals,
      token1Decimals: tokenB.decimals,
      isReversed,
    })
  }, [tickData, activeTick, feeTier, tokenA.decimals, tokenB.decimals, isReversed])

  // Lightweight-charts' built-in AreaSeries only round-trips `time` and `value`. To expose
  // the rest of each point (tick, price, activeLiquidity, swapToMove) in the tooltip we
  // look up by `time` against the source arrays.
  const pointByTime = useMemo(() => {
    const map = new Map<number, DepthPoint>()
    for (const p of sellData) {
      map.set(p.time as number, p)
    }
    for (const p of buyData) {
      map.set(p.time as number, p)
    }
    return map
  }, [sellData, buyData])

  const gapTime = useMemo(() => getGapTime(sellData, buyData), [sellData, buyData])

  // Standard depth chart convention: green (bids) on left, red (asks) on right.
  const sellColor = colors.statusSuccess.val
  const buyColor = colors.statusCritical.val

  const { base, quote } = getDisplayPair({ tokenA, tokenB, isReversed })

  const isBaseStable = useMemo(() => {
    if (!isUniverseChainId(base.chainId)) {
      return false
    }
    return getStablecoinsForChain(base.chainId).some((s) => s.equals(base))
  }, [base])

  const isQuoteStable = useMemo(() => {
    if (!isUniverseChainId(quote.chainId)) {
      return false
    }
    return getStablecoinsForChain(quote.chainId).some((s) => s.equals(quote))
  }, [quote])

  // When the quote is itself a stablecoin (e.g. ETH/USDT), label the USD row with that symbol.
  // Otherwise fall back to USDC, which is what useUSDCValue prices in.
  const usdSymbol = isQuoteStable ? (quote.symbol ?? quote.name ?? 'USDC') : 'USDC'

  const oneBaseAmount = useMemo(
    () =>
      base.isToken ? CurrencyAmount.fromRawAmount(base, (BigInt(10) ** BigInt(base.decimals)).toString()) : undefined,
    [base],
  )
  const baseUsdCurrencyAmount = useUSDCValue(oneBaseAmount)
  const baseUsdPrice = useMemo(
    () => (!isBaseStable && baseUsdCurrencyAmount ? parseFloat(baseUsdCurrencyAmount.toSignificant(10)) : undefined),
    [isBaseStable, baseUsdCurrencyAmount],
  )

  const crosshairColor = colors.neutral3.val

  const params = useMemo(
    () => ({
      data: [...sellData, ...buyData] as DepthPoint[],
      sellData,
      buyData,
      sellColor,
      buyColor,
      crosshairColor,
      isReversed,
      midPrice,
      hideTooltipBorder: true,
      onZoomActionsReady,
      onMirrorChange: setMirrorState,
      onGapChange: setGapState,
    }),
    [sellData, buyData, sellColor, buyColor, crosshairColor, isReversed, midPrice, onZoomActionsReady],
  )

  if (loading) {
    return <LoadingChart />
  }

  // Each side's array includes a 1-point anchor at the active tick that doesn't represent real liquidity.
  const realSellBars = Math.max(0, sellData.length - 1)
  const realBuyBars = Math.max(0, buyData.length - 1)
  if (realSellBars < MIN_DEPTH_BARS_PER_SIDE || realBuyBars < MIN_DEPTH_BARS_PER_SIDE) {
    return <ChartSkeleton type={ChartType.LIQUIDITY} height={PDP_CHART_HEIGHT_PX} errorText={t('chart.error.pools')} />
  }

  return (
    <Flex position="relative" width="100%" overflow="visible">
      <Chart
        height={PDP_CHART_HEIGHT_PX}
        Model={DepthChartModel}
        params={params}
        showDottedBackground
        TooltipBody={({ data }: { data: DepthPoint }) => {
          // Gap sentinel: LW tooltip suppressed — we render sell+buy pair as React components instead.
          if (gapTime !== null && (data.time as number) === gapTime) {
            return null
          }
          return (
            <DepthTooltipBody
              data={data}
              pointByTime={pointByTime}
              tokenA={tokenA}
              tokenB={tokenB}
              isReversed={isReversed}
              feeTierLabel={`${feeTier / BIPS_BASE}%`}
              midPrice={midPrice}
              sellColor={sellColor}
              buyColor={buyColor}
              baseUsdPrice={baseUsdPrice}
              usdSymbol={usdSymbol}
            />
          )
        }}
      >
        {() => {
          const displayPrice = toDisplayPrice(midPrice, isReversed)
          const { base: baseDescriptor, quote: quoteDescriptor } = getDisplayPair({
            tokenA: tokenADescriptor,
            tokenB: tokenBDescriptor,
            isReversed,
          })
          return (
            <ChartHeader
              value={
                <PriceDisplayContainer>
                  <Flex row>
                    <ChartPriceText>{`1 ${baseDescriptor} = `}</ChartPriceText>
                    <SubscriptZeroPrice
                      variant="heading3"
                      value={displayPrice}
                      subscriptThreshold={6}
                      symbol={quoteDescriptor}
                    />
                  </Flex>
                  {!isBaseStable && baseUsdCurrencyAmount && (
                    <ChartPriceText color="$neutral2">
                      {'(' +
                        convertFiatAmountFormatted(baseUsdCurrencyAmount.toSignificant(), NumberType.FiatTokenPrice) +
                        ')'}
                    </ChartPriceText>
                  )}
                </PriceDisplayContainer>
              }
              additionalFields={
                priceEntries && priceEntries.length >= 2 ? (
                  <PriceChartDelta
                    startingPrice={priceEntries[0].close}
                    endingPrice={priceEntries[priceEntries.length - 1].close}
                  />
                ) : undefined
              }
            />
          )
        }}
      </Chart>
      {mirrorState && (
        <Flex
          position="absolute"
          top={0}
          left={0}
          pointerEvents="none"
          zIndex={100}
          style={{ transform: mirrorState.transform }}
        >
          <TooltipShell>
            <DepthSideTooltipContent
              point={mirrorState.point}
              tokenA={tokenA}
              tokenB={tokenB}
              isReversed={isReversed}
              midPrice={midPrice}
              color={mirrorState.point.side === 'sell' ? sellColor : buyColor}
              feeTierLabel={`${feeTier / BIPS_BASE}%`}
              baseUsdPrice={baseUsdPrice}
              usdSymbol={usdSymbol}
            />
          </TooltipShell>
        </Flex>
      )}
      {gapState &&
        ([gapState.sell, gapState.buy] as const).map((side, i) => (
          <Flex
            key={i}
            position="absolute"
            top={0}
            left={0}
            pointerEvents="none"
            zIndex={100}
            style={{ transform: side.transform }}
          >
            <TooltipShell>
              <DepthSideTooltipContent
                point={side.point}
                tokenA={tokenA}
                tokenB={tokenB}
                isReversed={isReversed}
                midPrice={midPrice}
                color={side.point.side === 'sell' ? sellColor : buyColor}
                feeTierLabel={`${feeTier / BIPS_BASE}%`}
                baseUsdPrice={baseUsdPrice}
                usdSymbol={usdSymbol}
              />
            </TooltipShell>
          </Flex>
        ))}
    </Flex>
  )
}

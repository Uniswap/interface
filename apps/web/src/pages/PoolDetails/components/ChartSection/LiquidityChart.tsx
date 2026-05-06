import { ProtocolVersion as RestProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useSporeColors } from 'ui/src'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { useGetPoolsByTokens } from 'uniswap/src/data/rest/getPools'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ChartHeader } from '~/components/Charts/ChartHeader'
import { Chart } from '~/components/Charts/ChartModel'
import ErrorBoundary from '~/components/ErrorBoundary'
import { SubscriptZeroPrice } from '~/components/SubscriptZeroPrice'
import { LoadingChart } from '~/features/Explore/chart/LoadingChart'
import { TickTooltipContent } from '~/features/Liquidity/charts/ActiveLiquidityChart/TickTooltip'
import { LiquidityBarChartModel, useLiquidityBarData } from '~/features/Liquidity/charts/LiquidityChart'
import { LiquidityBarData } from '~/features/Liquidity/charts/LiquidityChart/types'
import { getTokenOrZeroAddress } from '~/features/Liquidity/utils/currency'

const PDP_CHART_HEIGHT_PX = 356

export function LiquidityChart({
  tokenA,
  tokenB,
  tokenAColor,
  tokenBColor,
  feeTier,
  isReversed,
  chainId,
  version,
  hooks,
  poolId,
}: {
  tokenA: Currency
  tokenB: Currency
  tokenAColor: string
  tokenBColor: string
  feeTier: FeeAmount
  isReversed: boolean
  chainId: UniverseChainId
  version: RestProtocolVersion
  hooks?: string
  poolId?: string
}) {
  const { t } = useTranslation()
  const tokenADescriptor = tokenA.symbol ?? tokenA.name ?? t('common.tokenA')
  const tokenBDescriptor = tokenB.symbol ?? tokenB.name ?? t('common.tokenB')

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

  const sdkCurrencies = useMemo(
    () => ({
      TOKEN0: tokenA,
      TOKEN1: tokenB,
    }),
    [tokenA, tokenB],
  )

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

  const colors = useSporeColors()
  const params = useMemo(() => {
    return {
      data: tickData?.barData ?? [],
      tokenAColor,
      tokenBColor,
      highlightColor: colors.surface3.val,
      activeTick,
      activeTickProgress: tickData?.activeRangePercentage,
      hideTooltipBorder: true,
    }
  }, [activeTick, tokenAColor, tokenBColor, colors, tickData])

  if (loading) {
    return <LoadingChart />
  }

  return (
    <Chart
      height={PDP_CHART_HEIGHT_PX}
      Model={LiquidityBarChartModel}
      params={params}
      showDottedBackground
      TooltipBody={({ data: crosshairData }: { data: LiquidityBarData }) => (
        // TODO(WEB-3628): investigate potential off-by-one or subgraph issues causing calculated TVL issues on 1 bip pools
        // Also remove Error Boundary when its determined its not needed
        <ErrorBoundary fallback={() => null}>
          {tickData?.activeRangeData && (
            <TickTooltipContent
              baseCurrency={tokenB}
              quoteCurrency={tokenA}
              hoveredTick={crosshairData}
              currentTick={tickData.activeRangeData.tick}
              currentPrice={parseFloat(tickData.activeRangeData.price0)}
              showQuoteCurrencyFirst={false}
            />
          )}
        </ErrorBoundary>
      )}
    >
      {(crosshair) => {
        const displayPoint = crosshair ?? tickData?.activeRangeData
        const display = (
          <Flex gap="$spacing8" $md={{ gap: '$spacing4' }}>
            <Text variant="heading3" animation="125ms" enterStyle={{ opacity: 0 }}>
              <Flex row gap="$spacing4">
                {`1 ${tokenADescriptor} =`}{' '}
                <SubscriptZeroPrice
                  variant="heading3"
                  value={parseFloat(displayPoint?.price0 ?? '0')}
                  subscriptThreshold={6}
                  symbol={tokenBDescriptor}
                />
              </Flex>
            </Text>
            <Text variant="heading3" animation="125ms" enterStyle={{ opacity: 0 }}>
              <Flex row gap="$spacing4">
                {' '}
                {`1 ${tokenBDescriptor} =`}{' '}
                <SubscriptZeroPrice
                  variant="heading3"
                  value={parseFloat(displayPoint?.price1 ?? '0')}
                  subscriptThreshold={6}
                  symbol={tokenADescriptor}
                />
              </Flex>
            </Text>
            {displayPoint && displayPoint.tick === activeTick && (
              <Text
                variant="subheading2"
                color="$neutral2"
                animation="125ms"
                enterStyle={{ opacity: 0 }}
                $md={{ variant: 'body3' }}
              >
                {t('pool.activeRange')}
              </Text>
            )}
          </Flex>
        )
        return <ChartHeader value={display} />
      }}
    </Chart>
  )
}

import { ProtocolVersion as RestProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Shine, Text } from 'ui/src'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { useGetPoolsByTokens } from 'uniswap/src/data/rest/getPools'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ChartHeader } from '~/components/Charts/ChartHeader'
import { ChartSkeleton } from '~/components/Charts/LoadingState'
import { ChartType } from '~/components/Charts/utils'
import { SubscriptZeroPrice } from '~/components/SubscriptZeroPrice'
import { D3HorizontalLiquidityChart } from '~/features/Liquidity/charts/D3HorizontalLiquidityChart/D3HorizontalLiquidityChart'
import { useDensityChartData } from '~/features/Liquidity/charts/LiquidityRangeInput/hooks'
import { ChartEntry } from '~/features/Liquidity/charts/LiquidityRangeInput/types'
import { useAllPoolTicks } from '~/features/Liquidity/hooks/usePoolTickData'
import { getTokenOrZeroAddress } from '~/features/Liquidity/utils/currency'
import { useColor } from '~/hooks/useColor'

const PDP_CHART_HEIGHT_PX = 356

export type D3LiquidityPoolChartZoomActions = {
  zoomIn: () => void
  zoomOut: () => void
  resetView: () => void
}

function buildSortedLiquidityData({
  liquidityData,
  tickSpacing,
  currentTick,
  isReversed,
}: {
  liquidityData: ChartEntry[] | undefined
  tickSpacing: number | undefined
  currentTick: number | undefined
  isReversed: boolean
}): ChartEntry[] | undefined {
  if (!liquidityData || !tickSpacing || currentTick === undefined) {
    return undefined
  }
  const activeTick = Math.floor(currentTick / tickSpacing) * tickSpacing
  const uniqueTicksMap = new Map<number, ChartEntry>()
  let prevAmounts: Pick<ChartEntry, 'amount0Locked' | 'amount1Locked'> | undefined
  liquidityData.forEach((entry) => {
    const visualTick = isReversed ? -entry.tick : entry.tick
    uniqueTicksMap.set(visualTick, {
      ...entry,
      tick: visualTick,
      ...(isReversed &&
        entry.tick !== activeTick && {
          amount0Locked: prevAmounts?.amount0Locked ?? 0,
          amount1Locked: prevAmounts?.amount1Locked ?? 0,
        }),
    })
    prevAmounts = entry
  })

  return Array.from(uniqueTicksMap.values()).sort((a, b) => a.price0 - b.price0)
}

function invertRawTicks<T extends { tick?: number; liquidityNet?: string } | undefined>(
  rawTicks: T[] | undefined,
): T[] | undefined {
  return rawTicks
    ?.map((t) =>
      t
        ? ({
            ...t,
            tick: t.tick !== undefined ? -t.tick : undefined,
            liquidityNet: t.liquidityNet ? String(-BigInt(t.liquidityNet)) : t.liquidityNet,
          } as T)
        : t,
    )
    .reverse()
}

function PriceHeader({
  baseDescriptor,
  quoteDescriptor,
  hasPriceData,
  displayPrice0,
  displayPrice1,
  isActiveRange,
}: {
  baseDescriptor: string
  quoteDescriptor: string
  hasPriceData: boolean
  displayPrice0: number
  displayPrice1: number
  isActiveRange: boolean
}): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex gap="$spacing8" $md={{ gap: '$spacing4' }}>
      <Text variant="heading3" animation="125ms" animateOnly={['opacity']} enterStyle={{ opacity: 0 }}>
        <Flex row gap="$spacing4">
          {`1 ${baseDescriptor} =`}{' '}
          {hasPriceData ? (
            <SubscriptZeroPrice
              variant="heading3"
              value={displayPrice0}
              subscriptThreshold={6}
              symbol={quoteDescriptor}
            />
          ) : (
            `-- ${quoteDescriptor}`
          )}
        </Flex>
      </Text>
      <Text variant="heading3" animation="125ms" animateOnly={['opacity']} enterStyle={{ opacity: 0 }}>
        <Flex row gap="$spacing4">
          {`1 ${quoteDescriptor} =`}{' '}
          {hasPriceData ? (
            <SubscriptZeroPrice
              variant="heading3"
              value={displayPrice1}
              subscriptThreshold={6}
              symbol={baseDescriptor}
            />
          ) : (
            `-- ${baseDescriptor}`
          )}
        </Flex>
      </Text>
      {isActiveRange && (
        <Text
          variant="subheading2"
          color="$neutral2"
          animation="125ms"
          animateOnly={['opacity']}
          enterStyle={{ opacity: 0 }}
          $md={{ variant: 'body3' }}
        >
          {t('pool.activeRange')}
        </Text>
      )}
    </Flex>
  )
}

function computeDisplayValues({
  displayPoint,
  visualActiveTick,
}: {
  displayPoint: ChartEntry | undefined
  visualActiveTick: number | undefined
}): {
  hasPriceData: boolean
  displayPrice0: number
  displayPrice1: number
  isActiveRange: boolean
} {
  const rawPrice0 = displayPoint?.price0
  const displayPrice0 = rawPrice0 ?? 0
  const hasPriceData = rawPrice0 !== undefined && rawPrice0 !== 0
  const displayPrice1 = displayPrice0 !== 0 ? 1 / displayPrice0 : 0
  const isActiveRange = visualActiveTick !== undefined && displayPoint?.tick === visualActiveTick
  return { hasPriceData, displayPrice0, displayPrice1, isActiveRange }
}

function computeVisualTicks({
  currentTick,
  tickSpacing,
  isReversed,
}: {
  currentTick: number | undefined
  tickSpacing: number | undefined
  isReversed: boolean
}): { visualCurrentTick: number | undefined; visualActiveTick: number | undefined } {
  const visualCurrentTick = currentTick !== undefined ? (isReversed ? -currentTick : currentTick) : undefined
  const visualActiveTick =
    visualCurrentTick !== undefined && tickSpacing
      ? Math.floor(visualCurrentTick / tickSpacing) * tickSpacing
      : undefined
  return { visualCurrentTick, visualActiveTick }
}

function useD3LiquidityPoolChartData({
  tokenA,
  tokenB,
  feeTier,
  isReversed,
  chainId,
  version,
  hooks,
  poolId,
}: {
  tokenA: Currency
  tokenB: Currency
  feeTier: FeeAmount
  isReversed: boolean
  chainId: UniverseChainId
  version: RestProtocolVersion
  hooks?: string
  poolId?: string
}) {
  const resolvedHooks = hooks ?? ZERO_ADDRESS

  const { data: poolData, isLoading: poolDataLoading } = useGetPoolsByTokens(
    {
      fee: feeTier,
      chainId,
      protocolVersions: [version],
      token0: getTokenOrZeroAddress(tokenA),
      token1: getTokenOrZeroAddress(tokenB),
      hooks: resolvedHooks,
    },
    true,
  )

  const tickSpacing = poolData?.pools[0]?.tickSpacing
  const currentTick = poolData?.pools[0]?.tick

  const sdkCurrencies = useMemo(() => ({ TOKEN0: tokenA, TOKEN1: tokenB }), [tokenA, tokenB])

  const { formattedData: liquidityData, isLoading: liquidityDataLoading } = useDensityChartData({
    poolId,
    sdkCurrencies,
    priceInverted: isReversed,
    version,
    chainId,
    feeAmount: feeTier,
    tickSpacing,
    hooks: resolvedHooks,
  })

  const { ticks: rawTicks, isLoading: rawTicksLoading } = useAllPoolTicks({
    sdkCurrencies,
    feeAmount: feeTier,
    chainId,
    version,
    tickSpacing,
    hooks: resolvedHooks,
    precalculatedPoolId: poolId,
  })

  const sortedLiquidityData = useMemo(
    () => buildSortedLiquidityData({ liquidityData, tickSpacing, currentTick, isReversed }),
    [liquidityData, isReversed, currentTick, tickSpacing],
  )

  const finalTickData = useMemo(() => (isReversed ? invertRawTicks(rawTicks) : rawTicks), [rawTicks, isReversed])

  const isLoading = poolDataLoading || liquidityDataLoading || rawTicksLoading

  return { tickSpacing, currentTick, sortedLiquidityData, finalTickData, isLoading }
}

export function D3LiquidityPoolChart({
  tokenA,
  tokenB,
  feeTier,
  isReversed,
  chainId,
  version,
  hooks,
  poolId,
  onZoomActionsReady,
}: {
  tokenA: Currency
  tokenB: Currency
  feeTier: FeeAmount
  isReversed: boolean
  chainId: UniverseChainId
  version: RestProtocolVersion
  hooks?: string
  poolId?: string
  onZoomActionsReady?: (actions: D3LiquidityPoolChartZoomActions) => void
}) {
  const { tickSpacing, currentTick, sortedLiquidityData, finalTickData, isLoading } = useD3LiquidityPoolChartData({
    tokenA,
    tokenB,
    feeTier,
    isReversed,
    chainId,
    version,
    hooks,
    poolId,
  })

  const token0Color = useColor(tokenA)
  const token1Color = useColor(tokenB)

  const { t } = useTranslation()
  const [baseCurrency, quoteCurrency] = isReversed ? [tokenB, tokenA] : [tokenA, tokenB]
  const baseDescriptor = baseCurrency.symbol ?? baseCurrency.name ?? t('common.tokenA')
  const quoteDescriptor = quoteCurrency.symbol ?? quoteCurrency.name ?? t('common.tokenB')

  const [hoveredEntry, setHoveredEntry] = useState<ChartEntry | undefined>(undefined)
  const handleHoveredTickChange = useCallback((tick: ChartEntry | undefined) => {
    setHoveredEntry(tick)
  }, [])

  const { visualCurrentTick, visualActiveTick } = computeVisualTicks({ currentTick, tickSpacing, isReversed })
  const activeTickEntry = useMemo(
    () => sortedLiquidityData?.find((d) => d.tick === visualActiveTick),
    [sortedLiquidityData, visualActiveTick],
  )

  const displayPoint = hoveredEntry ?? activeTickEntry
  const { hasPriceData, displayPrice0, displayPrice1, isActiveRange } = computeDisplayValues({
    displayPoint,
    visualActiveTick,
  })

  const hasError =
    !isLoading &&
    (!sortedLiquidityData ||
      sortedLiquidityData.length === 0 ||
      !finalTickData ||
      !tickSpacing ||
      currentTick === undefined)

  if (
    isLoading ||
    !sortedLiquidityData ||
    sortedLiquidityData.length === 0 ||
    !finalTickData ||
    !tickSpacing ||
    currentTick === undefined ||
    visualCurrentTick === undefined
  ) {
    return (
      <Shine disabled={hasError}>
        <ChartSkeleton
          type={ChartType.LIQUIDITY}
          height={PDP_CHART_HEIGHT_PX}
          errorText={
            hasError ? (
              <Text variant="body3" color="$neutral2">
                {t('pool.liquidity.error')}
              </Text>
            ) : undefined
          }
        />
      </Shine>
    )
  }

  return (
    <Flex height={PDP_CHART_HEIGHT_PX} position="relative">
      <ChartHeader
        value={
          <PriceHeader
            baseDescriptor={baseDescriptor}
            quoteDescriptor={quoteDescriptor}
            hasPriceData={hasPriceData}
            displayPrice0={displayPrice0}
            displayPrice1={displayPrice1}
            isActiveRange={isActiveRange}
          />
        }
      />
      <D3HorizontalLiquidityChart
        liquidityData={sortedLiquidityData}
        rawTicks={finalTickData}
        currentTick={visualCurrentTick}
        tickSpacing={tickSpacing}
        token0Color={token0Color}
        token1Color={token1Color}
        baseCurrency={baseCurrency}
        quoteCurrency={quoteCurrency}
        priceInverted={isReversed}
        protocolVersion={version}
        height={PDP_CHART_HEIGHT_PX}
        onActionsReady={onZoomActionsReady}
        onHoveredTickChange={handleHoveredTickChange}
      />
    </Flex>
  )
}

import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency, Price } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { useMemo } from 'react'
import { Flex, Shine, useSporeColors } from 'ui/src'
import { LoadingPriceCurve } from 'ui/src/components/icons/LoadingPriceCurve'
import { opacify } from 'ui/src/theme'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ErrorBoundary } from '~/components/ErrorBoundary'
import {
  CHART_HEIGHT,
  CHART_WIDTH,
} from '~/features/Liquidity/charts/LiquidityPositionRangeChart/LiquidityPositionRangeChart'
import { priceToNumber } from '~/features/Liquidity/charts/LiquidityPositionRangeChart/utils'
import { usePoolPriceChartData } from '~/features/Liquidity/charts/usePoolPriceChartData'

const SPARKLINE_PADDING = 2

function getLineColor(positionStatus: PositionStatus | undefined, colors: ReturnType<typeof useSporeColors>): string {
  switch (positionStatus) {
    case PositionStatus.OUT_OF_RANGE:
      return colors.statusCritical.val
    case PositionStatus.IN_RANGE:
      return colors.statusSuccess.val
    case PositionStatus.CLOSED:
    default:
      return colors.neutral2.val
  }
}

function buildSparklinePath(
  values: number[],
  opts: { width: number; height: number; minVal: number; maxVal: number },
): string {
  const { width, height, minVal, maxVal } = opts
  const range = maxVal - minVal || 1
  const padded = height - SPARKLINE_PADDING * 2
  const step = width / (values.length - 1)

  return values
    .map((v, i) => {
      const x = i * step
      const y = SPARKLINE_PADDING + padded - ((v - minVal) / range) * padded
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

interface LiquidityPositionSparklineProps {
  version: ProtocolVersion
  priceInverted: boolean
  poolAddressOrId?: string
  chainId: UniverseChainId
  positionStatus?: PositionStatus
  priceOrdering: {
    base?: Maybe<Currency>
    priceLower?: Maybe<Price<Currency, Currency>>
    priceUpper?: Maybe<Price<Currency, Currency>>
  }
}

function LiquidityPositionSparkline({
  version,
  priceInverted,
  poolAddressOrId,
  chainId,
  positionStatus,
  priceOrdering,
}: LiquidityPositionSparklineProps) {
  const colors = useSporeColors()
  const isV2 = version === ProtocolVersion.V2
  const isV3 = version === ProtocolVersion.V3
  const isV4 = version === ProtocolVersion.V4
  const chainInfo = getChainInfo(chainId)

  const variables = poolAddressOrId
    ? {
        addressOrId: poolAddressOrId,
        chain: chainInfo.backendChain.chain,
        duration: GraphQLApi.HistoryDuration.Month,
        isV4,
        isV3,
        isV2,
      }
    : undefined

  const priceData = usePoolPriceChartData({ variables, priceInverted })

  const rangeLower = isV2 ? 0 : priceToNumber(priceOrdering.priceLower, 0)
  const rangeUpper = isV2 ? Number.MAX_SAFE_INTEGER : priceToNumber(priceOrdering.priceUpper, Number.MAX_SAFE_INTEGER)

  const sparkline = useMemo(() => {
    const entries = priceData.entries
    if (entries.length < 2) {
      return null
    }

    const values = entries.map((e) => e.value)
    let minVal = Math.min(...values)
    let maxVal = Math.max(...values)

    const clampedLower = Math.max(rangeLower, minVal * 0.9)
    const clampedUpper = Math.min(rangeUpper, maxVal * 1.1)
    minVal = Math.min(minVal, clampedLower)
    maxVal = Math.max(maxVal, clampedUpper)

    const range = maxVal - minVal || 1
    const padded = CHART_HEIGHT - SPARKLINE_PADDING * 2

    const bandY1 = SPARKLINE_PADDING + padded - ((clampedUpper - minVal) / range) * padded
    const bandY2 = SPARKLINE_PADDING + padded - ((clampedLower - minVal) / range) * padded
    const bandHeight = bandY2 - bandY1

    const showBand = !isV2 && rangeLower > 0 && rangeUpper < Number.MAX_SAFE_INTEGER && bandHeight > 0

    const path = buildSparklinePath(values, { width: CHART_WIDTH, height: CHART_HEIGHT, minVal, maxVal })

    const lastX = CHART_WIDTH - 3
    const lastVal = values[values.length - 1]
    const lastY = SPARKLINE_PADDING + padded - ((lastVal - minVal) / range) * padded

    return { path, bandY1, bandHeight, showBand, lastX, lastY }
  }, [priceData.entries, rangeLower, rangeUpper, isV2])

  const loading = priceData.loading && priceData.entries.length === 0
  const dataUnavailable = priceData.entries.length === 0 && !priceData.loading

  if (dataUnavailable) {
    return <Flex height={CHART_HEIGHT} width={CHART_WIDTH} $md={{ width: '100%' }} />
  }

  if (loading) {
    return (
      <Shine
        height={CHART_HEIGHT}
        width={CHART_WIDTH}
        $md={{ width: '100%' }}
        alignItems="center"
        justifyContent="center"
      >
        <LoadingPriceCurve size={{ width: CHART_WIDTH, height: CHART_HEIGHT }} color="$neutral2" />
      </Shine>
    )
  }

  if (!sparkline) {
    return <Flex height={CHART_HEIGHT} width={CHART_WIDTH} $md={{ width: '100%' }} />
  }

  const lineColor = getLineColor(positionStatus, colors)

  return (
    <Flex height={CHART_HEIGHT} width={CHART_WIDTH} $md={{ width: '100%' }}>
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        style={{ display: 'block' }}
      >
        {sparkline.showBand && (
          <>
            <rect
              x={0}
              y={sparkline.bandY1}
              width={CHART_WIDTH}
              height={sparkline.bandHeight}
              fill={colors.surface3.val}
            />
            <line
              x1={0}
              y1={sparkline.bandY1}
              x2={CHART_WIDTH}
              y2={sparkline.bandY1}
              stroke={opacify(40, colors.neutral1.val)}
              strokeWidth={1}
            />
            <line
              x1={0}
              y1={sparkline.bandY1 + sparkline.bandHeight}
              x2={CHART_WIDTH}
              y2={sparkline.bandY1 + sparkline.bandHeight}
              stroke={opacify(40, colors.neutral1.val)}
              strokeWidth={1}
            />
          </>
        )}
        <line
          x1={0}
          y1={sparkline.lastY}
          x2={CHART_WIDTH}
          y2={sparkline.lastY}
          stroke={lineColor}
          strokeWidth={1}
          strokeDasharray="3,3"
        />
        <path
          d={sparkline.path}
          fill="none"
          stroke={lineColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={sparkline.lastX} cy={sparkline.lastY} r={3} fill={lineColor} />
      </svg>
    </Flex>
  )
}

export function WrappedLiquidityPositionSparkline(props: LiquidityPositionSparklineProps): JSX.Element {
  return (
    <ErrorBoundary fallback={() => null}>
      <LiquidityPositionSparkline {...props} />
    </ErrorBoundary>
  )
}

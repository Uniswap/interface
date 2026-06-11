/* oxlint-disable max-lines */
import type { AuctionStep } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import type { ISeriesApi, MouseEventParams, Time, UTCTimestamp } from 'lightweight-charts'
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useSporeColors } from 'ui/src'
import { opacify } from 'ui/src/theme'
import { zIndexes } from 'ui/src/theme/zIndexes'
import type { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import { computeSimulationResult } from '~/features/Toucan/Auction/ActivityTimeline/SimulationTab/utils/computeSimulationResult'
import { fromQ96ToDecimalWithTokenDecimals } from '~/features/Toucan/Auction/BidDistributionChart/utils/q96'
import { AUCTION_CHART_HEIGHT, useAuctionChart } from '~/features/Toucan/Auction/hooks/useAuctionChart'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { blockToTimestamp } from '~/features/Toucan/Auction/utils/blockToTimestamp'
import { formatCompactFromRaw } from '~/features/Toucan/Auction/utils/fixedPointFdv'
import { formatShortDateTime } from '~/features/Toucan/Auction/utils/formatting'
import { TooltipContainer } from '~/features/Toucan/Shared/TooltipContainer'

interface PriceCurvePoint {
  time: UTCTimestamp
  price: number
}

interface SimulationChartProps {
  maxTokenPrice: number | null // decimal price — null means no threshold
  expectedFinalPrice: number // where the price curve ends
  budget: number
  tokenSymbol: string
}

interface TooltipData {
  dateLabel: string
  tokensReleasedFormatted: string
  tokensReceivedFormatted: string
  isOutbid: boolean
  x: number
  y: number
}

/**
 * Linearly interpolates the price at a given timestamp along the curve.
 */
function interpolatePrice(time: number, curve: PriceCurvePoint[]): number | null {
  if (curve.length === 0) {
    return null
  }
  if (time <= curve[0].time) {
    return curve[0].price
  }
  if (time >= curve[curve.length - 1].time) {
    return curve[curve.length - 1].price
  }
  for (let i = 1; i < curve.length; i++) {
    if (time <= curve[i].time) {
      const prev = curve[i - 1]
      const next = curve[i]
      const t = (time - prev.time) / (next.time - prev.time)
      return prev.price + (next.price - prev.price) * t
    }
  }
  return null
}

const ChartTooltip = forwardRef<HTMLDivElement, { data: TooltipData; containerWidth: number }>(function ChartTooltip(
  { data, containerWidth },
  ref,
) {
  const { t } = useTranslation()
  const tooltipEl = (ref as React.RefObject<HTMLDivElement> | null)?.current
  const tooltipWidth = tooltipEl?.offsetWidth ?? 0
  const halfWidth = tooltipWidth / 2
  const PADDING = 4

  // Clamp left so tooltip stays within the container
  let left = data.x
  if (left - halfWidth < PADDING) {
    left = halfWidth + PADDING
  } else if (left + halfWidth > containerWidth - PADDING) {
    left = containerWidth - halfWidth - PADDING
  }

  return (
    <TooltipContainer
      ref={ref}
      zIndex={zIndexes.tooltip}
      py="$spacing4"
      px="$spacing6"
      gap="$spacing4"
      width="max-content"
      style={{
        left: `${left}px`,
        top: `${data.y}px`,
        transform: 'translate(-50%, -110%)',
      }}
    >
      <Text variant="body4" color="$neutral2">
        {data.dateLabel}
      </Text>

      <Flex width="100%" height={1} backgroundColor="$surface3" />

      <Flex gap="$spacing2">
        <Text variant="body4" color="$neutral1">
          {t('toucan.details.totalReleased')} {data.tokensReleasedFormatted}
        </Text>
        <Text variant="body4" color={data.isOutbid ? '$statusCritical' : '$neutral1'}>
          {t('toucan.simulation.tooltipTokensReceived')} {data.tokensReceivedFormatted}
        </Text>
      </Flex>
    </TooltipContainer>
  )
})

/**
 * Builds a projected price curve from auction steps.
 *
 * Price grows proportionally to cumulative supply released (mps × blocks).
 * High-MPS steps = more supply = faster price rise.
 * Zero-MPS steps = no supply = flat price.
 */
function buildPriceCurve({
  steps,
  startPrice,
  endPrice,
  startBlock,
  endBlock,
  anchorBlock,
  anchorTime,
  chainId,
}: {
  steps: AuctionStep[]
  startPrice: number
  endPrice: number
  startBlock: number
  endBlock: number
  anchorBlock: number
  anchorTime: Date
  chainId: EVMUniverseChainId
}): PriceCurvePoint[] {
  if (steps.length === 0 || endPrice <= startPrice) {
    return []
  }

  const toTimestamp = (block: number): UTCTimestamp =>
    (blockToTimestamp({ block, anchorBlock, anchorTime, chainId }).getTime() / 1000) as UTCTimestamp

  const priceRange = endPrice - startPrice

  // Build segments from steps, clipped to [startBlock, endBlock]
  const segments: { blocks: number; mps: number; blockStart: number }[] = []
  let cumulativeMps = 0

  for (let i = 0; i < steps.length; i++) {
    const stepStart = Math.max(Number(steps[i].startBlock), startBlock)
    const stepEnd = Math.min(i < steps.length - 1 ? Number(steps[i + 1].startBlock) : endBlock, endBlock)
    if (stepStart >= stepEnd) {
      continue
    }

    const mps = Number(steps[i].mps) || 0
    const blocks = stepEnd - stepStart
    segments.push({ blocks, mps, blockStart: stepStart })
    cumulativeMps += mps * blocks
  }

  const totalMps = cumulativeMps || 1
  const points: PriceCurvePoint[] = []
  let runningMps = 0

  // Starting point
  points.push({ time: toTimestamp(startBlock), price: startPrice })

  for (const seg of segments) {
    const segMpsTotal = seg.mps * seg.blocks
    runningMps += segMpsTotal
    const pct = runningMps / totalMps

    points.push({
      time: toTimestamp(seg.blockStart + seg.blocks),
      price: startPrice + priceRange * pct,
    })
  }

  return points
}

export function SimulationChart({ maxTokenPrice, expectedFinalPrice, budget, tokenSymbol }: SimulationChartProps) {
  const colors = useSporeColors()
  const auctionDetails = useAuctionStore((state) => state.auctionDetails)

  const bidTokenDecimals = auctionDetails?.currencyTokenDecimals ?? 18
  const auctionTokenDecimals = auctionDetails?.tokenDecimals ?? 18

  const totalSupplyRaw = auctionDetails?.totalSupply ? BigInt(auctionDetails.totalSupply) : 0n

  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const floorPrice = useMemo(() => {
    if (!auctionDetails?.floorPrice) {
      return 0
    }
    return fromQ96ToDecimalWithTokenDecimals({
      q96Value: auctionDetails.floorPrice,
      bidTokenDecimals,
      auctionTokenDecimals,
    })
  }, [auctionDetails?.floorPrice, bidTokenDecimals, auctionTokenDecimals])

  // Build the curve
  const priceCurve = useMemo(() => {
    if (
      !auctionDetails?.parsedAuctionSteps ||
      !auctionDetails.startBlock ||
      !auctionDetails.endBlock ||
      !auctionDetails.creationBlock ||
      !auctionDetails.createdAt
    ) {
      return []
    }

    const steps = auctionDetails.parsedAuctionSteps

    return buildPriceCurve({
      steps,
      startPrice: floorPrice,
      endPrice: expectedFinalPrice,
      startBlock: Number(auctionDetails.startBlock),
      endBlock: Number(auctionDetails.endBlock),
      anchorBlock: Number(auctionDetails.creationBlock),
      anchorTime: new Date(auctionDetails.createdAt),
      chainId: auctionDetails.chainId,
    })
  }, [auctionDetails, floorPrice, expectedFinalPrice])

  // Split curve into active (green) and outbid (red) at maxTokenPrice
  const { activeCurve, outbidCurve } = useMemo(() => {
    if (!maxTokenPrice || maxTokenPrice <= 0) {
      return { activeCurve: priceCurve, outbidCurve: [] as PriceCurvePoint[] }
    }

    const crossIdx = priceCurve.findIndex((p) => p.price > maxTokenPrice)
    if (crossIdx === -1) {
      return { activeCurve: priceCurve, outbidCurve: [] as PriceCurvePoint[] }
    }
    if (crossIdx === 0) {
      return { activeCurve: [] as PriceCurvePoint[], outbidCurve: priceCurve }
    }

    const prev = priceCurve[crossIdx - 1]
    const next = priceCurve[crossIdx]
    const priceDelta = next.price - prev.price
    if (priceDelta <= 0) {
      // Flat segment — just split at the index
      return {
        activeCurve: priceCurve.slice(0, crossIdx + 1),
        outbidCurve: priceCurve.slice(crossIdx),
      }
    }

    const ratio = (maxTokenPrice - prev.price) / priceDelta
    let crossTime = (prev.time + (next.time - prev.time) * ratio) as UTCTimestamp

    // Ensure strictly ascending: nudge if crossTime collides with prev or next
    if (crossTime <= prev.time) {
      crossTime = (prev.time + 1) as UTCTimestamp
    }
    if (crossTime >= next.time) {
      crossTime = (next.time - 1) as UTCTimestamp
    }

    // If there's no room between prev and next, fall back to index-based split
    if (crossTime <= prev.time) {
      return {
        activeCurve: priceCurve.slice(0, crossIdx + 1),
        outbidCurve: priceCurve.slice(crossIdx),
      }
    }

    const crossPoint: PriceCurvePoint = {
      time: crossTime,
      price: maxTokenPrice,
    }
    const active = [...priceCurve.slice(0, crossIdx), crossPoint]
    const outbid = [crossPoint, ...priceCurve.slice(crossIdx)]

    return { activeCurve: active, outbidCurve: outbid }
  }, [priceCurve, maxTokenPrice])

  // Fixed evenly-spaced time points spanning the full auction duration.
  // Used as an invisible baseline series to anchor lightweight-charts' tick placement
  // so the x-axis doesn't jump when the active/outbid split changes.
  const baselinePoints = useMemo(() => {
    if (priceCurve.length < 2) {
      return []
    }
    const first = priceCurve[0].time
    const last = priceCurve[priceCurve.length - 1].time
    const count = Math.max(priceCurve.length, 10)
    const step = (last - first) / (count - 1)
    return Array.from({ length: count }, (_, i) => ({
      time: (first + step * i) as UTCTimestamp,
      value: 0,
    }))
  }, [priceCurve])

  const handleCrosshairMove = useCallback(
    (param: MouseEventParams<Time>) => {
      if (!param.time || !param.point) {
        setTooltipData(null)
        return
      }

      const time = param.time as number
      const price = interpolatePrice(time, priceCurve)
      if (price === null) {
        setTooltipData(null)
        return
      }

      const date = new Date(time * 1000)
      const isOutbid = maxTokenPrice !== null && price > maxTokenPrice

      const { tokensReceived: tokensReceivedDecimal } = computeSimulationResult({
        currentPrice: price,
        maxTokenPrice: maxTokenPrice ?? price,
        floorPrice,
        expectedFinalPrice,
        budget,
      })
      const decimalScale = 10 ** auctionTokenDecimals
      const tokensReceived = BigInt(Math.round(tokensReceivedDecimal * decimalScale))

      // Tokens released: fraction of total supply proportional to price progress
      const priceRange = expectedFinalPrice - floorPrice
      const fractionReleased = priceRange > 0 ? Math.min(1, Math.max(0, (price - floorPrice) / priceRange)) : 0
      const tokensReleasedRaw =
        totalSupplyRaw > 0n ? (totalSupplyRaw * BigInt(Math.round(fractionReleased * 1e9))) / BigInt(1e9) : 0n

      setTooltipData({
        dateLabel: formatShortDateTime(date),
        tokensReleasedFormatted: `${formatCompactFromRaw({
          raw: tokensReleasedRaw,
          decimals: auctionTokenDecimals,
          maxFractionDigits: 2,
        })} ${tokenSymbol}`,
        tokensReceivedFormatted: `${formatCompactFromRaw({
          raw: tokensReceived,
          decimals: auctionTokenDecimals,
          maxFractionDigits: 2,
        })} ${tokenSymbol}`,
        isOutbid,
        x: param.point.x,
        y: param.point.y,
      })
    },
    [
      priceCurve,
      maxTokenPrice,
      budget,
      expectedFinalPrice,
      floorPrice,
      totalSupplyRaw,
      auctionTokenDecimals,
      tokenSymbol,
    ],
  )

  const { containerRef, chart } = useAuctionChart({
    enabled: priceCurve.length > 0,
  })

  // Keep a stable ref to the latest crosshair handler so the subscription
  // effect doesn't need to tear down series on every callback change.
  const handleCrosshairMoveRef = useRef(handleCrosshairMove)
  handleCrosshairMoveRef.current = handleCrosshairMove

  // Series refs — created once when chart mounts, updated via .setData() on data changes
  const baselineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const activeSeriesRef = useRef<ISeriesApi<'Area'> | null>(null)
  const outbidSeriesRef = useRef<ISeriesApi<'Area'> | null>(null)
  const thresholdSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)

  // Create series and subscribe to crosshair — only when chart instance changes
  useEffect(() => {
    if (!chart) {
      return undefined
    }

    const handler = (param: MouseEventParams<Time>) => handleCrosshairMoveRef.current(param)
    chart.subscribeCrosshairMove(handler)

    baselineSeriesRef.current = chart.addLineSeries({
      priceScaleId: 'baseline',
      visible: false,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    })

    activeSeriesRef.current = chart.addAreaSeries({
      priceScaleId: 'overlay-price',
      lineWidth: 2,
      lineColor: colors.statusSuccess.val,
      topColor: opacify(20, colors.statusSuccess.val),
      bottomColor: opacify(0, colors.statusSuccess.val),
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerRadius: 4,
      crosshairMarkerBackgroundColor: colors.statusSuccess.val,
      crosshairMarkerBorderColor: colors.statusSuccess.val,
    })

    outbidSeriesRef.current = chart.addAreaSeries({
      priceScaleId: 'overlay-price',
      lineWidth: 2,
      lineColor: colors.statusCritical.val,
      topColor: opacify(20, colors.statusCritical.val),
      bottomColor: opacify(0, colors.statusCritical.val),
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerRadius: 4,
      crosshairMarkerBackgroundColor: colors.statusCritical.val,
      crosshairMarkerBorderColor: colors.statusCritical.val,
    })

    thresholdSeriesRef.current = chart.addLineSeries({
      priceScaleId: 'overlay-price',
      lineWidth: 1,
      lineStyle: 2, // dashed
      color: colors.neutral3.val,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    })

    return () => {
      try {
        chart.unsubscribeCrosshairMove(handler)
        if (baselineSeriesRef.current) {
          chart.removeSeries(baselineSeriesRef.current)
        }
        if (activeSeriesRef.current) {
          chart.removeSeries(activeSeriesRef.current)
        }
        if (outbidSeriesRef.current) {
          chart.removeSeries(outbidSeriesRef.current)
        }
        if (thresholdSeriesRef.current) {
          chart.removeSeries(thresholdSeriesRef.current)
        }
      } catch {
        // chart may already be removed during unmount
      }
      baselineSeriesRef.current = null
      activeSeriesRef.current = null
      outbidSeriesRef.current = null
      thresholdSeriesRef.current = null
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- colors excluded: initial values used at creation, separate effect handles theme updates via applyOptions
  }, [chart])

  // Update series colors on theme change without tearing down series
  useEffect(() => {
    activeSeriesRef.current?.applyOptions({
      lineColor: colors.statusSuccess.val,
      topColor: opacify(20, colors.statusSuccess.val),
      bottomColor: opacify(0, colors.statusSuccess.val),
      crosshairMarkerBackgroundColor: colors.statusSuccess.val,
      crosshairMarkerBorderColor: colors.statusSuccess.val,
    })
    outbidSeriesRef.current?.applyOptions({
      lineColor: colors.statusCritical.val,
      topColor: opacify(20, colors.statusCritical.val),
      bottomColor: opacify(0, colors.statusCritical.val),
      crosshairMarkerBackgroundColor: colors.statusCritical.val,
      crosshairMarkerBorderColor: colors.statusCritical.val,
    })
    thresholdSeriesRef.current?.applyOptions({
      color: colors.neutral3.val,
    })
  }, [colors])

  // Update series data without tearing down — runs on every slider change
  useEffect(() => {
    if (!chart) {
      return
    }

    baselineSeriesRef.current?.setData(baselinePoints)
    activeSeriesRef.current?.setData(activeCurve.map((p) => ({ time: p.time, value: p.price })))
    outbidSeriesRef.current?.setData(outbidCurve.map((p) => ({ time: p.time, value: p.price })))

    if (maxTokenPrice && maxTokenPrice > 0 && priceCurve.length >= 2) {
      const first = priceCurve[0]
      const last = priceCurve[priceCurve.length - 1]
      thresholdSeriesRef.current?.setData([
        { time: first.time, value: maxTokenPrice },
        { time: last.time, value: maxTokenPrice },
      ])
    } else {
      thresholdSeriesRef.current?.setData([])
    }

    chart.timeScale().fitContent()
  }, [chart, priceCurve, activeCurve, outbidCurve, baselinePoints, maxTokenPrice])

  if (priceCurve.length === 0) {
    return null
  }

  return (
    <Flex position="relative" width="100%" height={AUCTION_CHART_HEIGHT}>
      <Flex ref={containerRef} width="100%" height={AUCTION_CHART_HEIGHT} />
      {tooltipData && (
        <ChartTooltip ref={tooltipRef} data={tooltipData} containerWidth={containerRef.current?.clientWidth ?? 0} />
      )}
    </Flex>
  )
}

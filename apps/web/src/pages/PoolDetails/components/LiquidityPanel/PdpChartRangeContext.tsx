import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import type { PriceChartRangeBand } from '~/components/Charts/PriceChart/PriceChartModel'
import type { DraggableRange } from '~/components/Charts/rangeDrag'
import { priceToTickWithDecimals } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/priceToTick'
import {
  getUsableTickBounds,
  snapTickToSpacing,
} from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/tickUtils'
import { useCreateLiquidityContext } from '~/features/Liquidity/Create/CreateLiquidityContextProvider'
import type { TickRange } from '~/features/Liquidity/Create/types'
import { toDisplayTickRange } from '~/features/Liquidity/utils/displayTicks'
import { priceFromTick } from '~/features/Liquidity/utils/getTickToPrice'
import { usePdpFlowActivity } from '~/pages/PoolDetails/components/LiquidityPanel/PdpFlowActivityContext'

/**
 * A tick range as prices of token0 in token1, the orientation the pool's price history is served in: the
 * chart's band range. An edge at the usable tick bound (a one-sided range) is open, as there's no price to draw it at.
 */
export type ChartPriceRange = DraggableRange

/** A full range as chart prices: both edges open. One constant, so the range keeps its identity across renders. */
export const FULL_CHART_PRICE_RANGE: ChartPriceRange = Object.freeze({})

/** A pool tick range as chart prices, leaving an edge at the usable tick bound open. */
export function poolTicksToChartPriceRange({
  tickLower,
  tickUpper,
  decimals0,
  decimals1,
  tickSpacing,
}: {
  tickLower: number
  tickUpper: number
  decimals0: number
  decimals1: number
  tickSpacing: number
}): ChartPriceRange {
  const bounds = getUsableTickBounds(tickSpacing)
  const toPrice = (tick: number) => priceFromTick({ tick, token0Decimals: decimals0, token1Decimals: decimals1 })
  return {
    lower: tickLower <= bounds.minTick ? undefined : toPrice(tickLower),
    upper: tickUpper >= bounds.maxTick ? undefined : toPrice(tickUpper),
  }
}

/**
 * Chart prices for a range of display-space ticks (negated and swapped when the price is inverted), the
 * inverse of `chartPriceRangeToDisplayTicks`.
 */
export function displayTicksToChartPriceRange({
  range,
  decimals0,
  decimals1,
  tickSpacing,
  priceInverted,
}: {
  range: TickRange
  decimals0: number
  decimals1: number
  tickSpacing: number
  priceInverted: boolean
}): ChartPriceRange {
  // The flip is its own inverse: display ticks map back to pool ticks the same way.
  const { minTick: tickLower, maxTick: tickUpper } = toDisplayTickRange(
    { tickLower: range.minTick, tickUpper: range.maxTick },
    priceInverted,
  )
  return poolTicksToChartPriceRange({ tickLower, tickUpper, decimals0, decimals1, tickSpacing })
}

/**
 * The display-space ticks (negated and swapped when the price is inverted) for a range of token0-in-token1
 * prices, snapped to the pool's spacing. An open edge goes to the usable bound, and the range is kept at
 * least one spacing wide.
 */
export function chartPriceRangeToDisplayTicks({
  range,
  decimals0,
  decimals1,
  tickSpacing,
  priceInverted,
}: {
  range: ChartPriceRange
  decimals0: number
  decimals1: number
  tickSpacing: number
  priceInverted: boolean
}): TickRange {
  const bounds = getUsableTickBounds(tickSpacing)
  const toTick = (price: number | undefined, openTick: number) =>
    price === undefined || price <= 0
      ? openTick
      : snapTickToSpacing(
          priceToTickWithDecimals({ price, baseDecimals: decimals0, quoteDecimals: decimals1 }),
          tickSpacing,
        )
  const tickLower = toTick(range.lower, bounds.minTick)
  const tickUpper = Math.max(toTick(range.upper, bounds.maxTick), tickLower + tickSpacing)
  return toDisplayTickRange({ tickLower, tickUpper }, priceInverted)
}

/** The same range for a chart showing token1 in token0 instead. */
export function invertChartPriceRange({ lower, upper }: ChartPriceRange): ChartPriceRange {
  return { lower: upper === undefined ? undefined : 1 / upper, upper: lower === undefined ? undefined : 1 / lower }
}

/**
 * The display-space ticks for a band set on a price chart, which plots token1 in token0 when `isReversed`;
 * see `chartPriceRangeToDisplayTicks`.
 */
export function chartBandToDisplayTicks({
  band,
  isReversed,
  ...rest
}: {
  band: ChartPriceRange
  isReversed: boolean
  decimals0: number
  decimals1: number
  tickSpacing: number
  priceInverted: boolean
}): TickRange {
  return chartPriceRangeToDisplayTicks({ range: isReversed ? invertChartPriceRange(band) : band, ...rest })
}

type PdpChartRangeContextValue = {
  range?: ChartPriceRange
  /** Commits a band set on a chart that plots token1 in token0 when `isReversed`. */
  setRange?: (band: ChartPriceRange, isReversed: boolean) => void
  /** Previews such a band, or clears the preview with undefined. */
  setPreviewBand?: (band: ChartPriceRange | undefined, isReversed: boolean) => void
}

const PdpChartRangeContext = createContext<PdpChartRangeContextValue>({})

// Apart from the range so a component that only sets previews doesn't re-render for each one.
const PdpChartRangePreviewContext = createContext<(range: TickRange | undefined) => void>(() => {})
const PdpChartRangePreviewValueContext = createContext<TickRange | undefined>(undefined)

// The range read on demand, for a reader that only needs it on a press: it changes on every drag preview.
const PdpChartRangeGetterContext = createContext<() => ChartPriceRange | undefined>(() => undefined)

/**
 * Publishes the deposit's range to the pool details chart, so the chart can highlight where the position
 * would sit without depending on the create-position flow.
 */
export function PdpChartRangeProvider({ children }: { children: ReactNode }): JSX.Element {
  const { ticks, currencies, priceRangeState, setPriceRangeState, poolOrPair } = useCreateLiquidityContext()
  const tickSpacing = poolOrPair && 'tickSpacing' in poolOrPair ? poolOrPair.tickSpacing : undefined
  const [tickLower, tickUpper] = ticks
  const decimals0 = currencies.sdk.TOKEN0?.decimals
  const decimals1 = currencies.sdk.TOKEN1?.decimals
  const { priceInverted, fullRange } = priceRangeState
  // Before the default range is seeded the flow's ticks fall back to the extremes, which would blow out the
  // chart's scale; a full range has no edge to draw, so it's shown as the whole chart instead.
  const isSeeded = priceRangeState.minTick !== undefined && priceRangeState.maxTick !== undefined

  const committedRange = useMemo(() => {
    if (fullRange) {
      return FULL_CHART_PRICE_RANGE
    }
    if (
      !isSeeded ||
      tickLower === undefined ||
      tickLower === null ||
      tickUpper === undefined ||
      tickUpper === null ||
      decimals0 === undefined ||
      decimals1 === undefined ||
      tickSpacing === undefined
    ) {
      return undefined
    }
    return poolTicksToChartPriceRange({ tickLower, tickUpper, decimals0, decimals1, tickSpacing })
  }, [fullRange, isSeeded, tickLower, tickUpper, decimals0, decimals1, tickSpacing])

  const [preview, setPreview] = useState<TickRange>()
  // A landed commit supersedes the preview, and a flip re-expresses display ticks, so either drops it;
  // otherwise a drag that never clears its preview would leave the band stuck on it.
  const [previewedAgainst, setPreviewedAgainst] = useState({ committedRange, priceInverted })
  if (previewedAgainst.committedRange !== committedRange || previewedAgainst.priceInverted !== priceInverted) {
    setPreviewedAgainst({ committedRange, priceInverted })
    setPreview(undefined)
  }

  // The PDP draws no range until a deposit is started, and again once it's cleared. The position page has no
  // such flow, so it always draws its range.
  const isPdpFlowIdle = usePdpFlowActivity()?.isActive === false

  const range = useMemo(() => {
    if (isPdpFlowIdle) {
      return undefined
    }
    if (!preview || decimals0 === undefined || decimals1 === undefined || tickSpacing === undefined) {
      return committedRange
    }
    return displayTicksToChartPriceRange({ range: preview, decimals0, decimals1, tickSpacing, priceInverted })
  }, [isPdpFlowIdle, preview, committedRange, decimals0, decimals1, tickSpacing, priceInverted])

  const bandToDisplayTicks = useCallback(
    (band: ChartPriceRange, isReversed: boolean): TickRange | undefined =>
      decimals0 === undefined || decimals1 === undefined || tickSpacing === undefined
        ? undefined
        : chartBandToDisplayTicks({ band, isReversed, decimals0, decimals1, tickSpacing, priceInverted }),
    [decimals0, decimals1, tickSpacing, priceInverted],
  )

  // A range set from the chart is a custom one, like an edit in the range editor.
  const setRange = useCallback(
    (band: ChartPriceRange, isReversed: boolean) => {
      const displayTicks = bandToDisplayTicks(band, isReversed)
      if (displayTicks) {
        setPriceRangeState((prev) => ({ ...prev, fullRange: false, ...displayTicks, followedPreset: undefined }))
      }
    },
    [bandToDisplayTicks, setPriceRangeState],
  )

  // Set by dragging the price chart's edge lines; the range chart's handles set it directly (see `setPreview`).
  const setPreviewBand = useCallback(
    (band: ChartPriceRange | undefined, isReversed: boolean) =>
      setPreview(band && bandToDisplayTicks(band, isReversed)),
    [bandToDisplayTicks],
  )

  const rangeRef = useRef(range)
  useLayoutEffect(() => {
    rangeRef.current = range
  })
  const getRange = useCallback(() => rangeRef.current, [])

  const value = useMemo(() => ({ range, setRange, setPreviewBand }), [range, setRange, setPreviewBand])
  return (
    <PdpChartRangeGetterContext.Provider value={getRange}>
      <PdpChartRangePreviewContext.Provider value={setPreview}>
        <PdpChartRangePreviewValueContext.Provider value={preview}>
          <PdpChartRangeContext.Provider value={value}>{children}</PdpChartRangeContext.Provider>
        </PdpChartRangePreviewValueContext.Provider>
      </PdpChartRangePreviewContext.Provider>
    </PdpChartRangeGetterContext.Provider>
  )
}

/** The range as it stands when called, oriented like a chart that plots token1 in token0 when `isReversed`. */
export function usePdpChartRangeGetter(isReversed: boolean): () => ChartPriceRange | undefined {
  const getRange = useContext(PdpChartRangeGetterContext)
  return useCallback(() => {
    const range = getRange()
    return range && (isReversed ? invertChartPriceRange(range) : range)
  }, [getRange, isReversed])
}

/**
 * Shows a range on the chart band while it's being dragged on the range chart, without committing it to the
 * flow. Display-space ticks (negated when the price is inverted), like `priceRangeState`. Pass undefined to
 * clear. The setter is stable, and a no-op off the PDP revamp.
 */
export function usePdpChartRangePreview(): (range: TickRange | undefined) => void {
  return useContext(PdpChartRangePreviewContext)
}

/**
 * The range being dragged, on the price chart's edge lines or the range chart's handles, before it's
 * committed: display-space ticks, like `priceRangeState`. Undefined while nothing is dragged, and off the PDP
 * revamp.
 */
export function usePdpChartRangePreviewValue(): TickRange | undefined {
  return useContext(PdpChartRangePreviewValueContext)
}

/**
 * The range as the price chart's band, oriented like its series (token0 in token1 unless reversed), a setter
 * taking a band dragged on that chart, and one previewing it mid-drag (undefined to clear). The setters are
 * undefined off the PDP revamp.
 */
export function usePdpChartRangeBand(isReversed: boolean): {
  rangeBand?: PriceChartRangeBand
  onRangeBandChange?: (band: ChartPriceRange) => void
  onRangeBandPreview?: (band: ChartPriceRange | undefined) => void
} {
  const { t } = useTranslation()
  const { range, setRange, setPreviewBand } = useContext(PdpChartRangeContext)
  const rangeBand = useMemo(() => {
    const oriented = range && (isReversed ? invertChartPriceRange(range) : range)
    return (
      oriented && {
        ...oriented,
        lowerLabel: t('common.min'),
        upperLabel: t('common.max'),
      }
    )
  }, [range, isReversed, t])
  // Apart from the band, which changes on every preview, so the setters stay stable through a drag.
  const setters = useMemo(
    () => ({
      onRangeBandChange: setRange && ((band: ChartPriceRange) => setRange(band, isReversed)),
      onRangeBandPreview: setPreviewBand && ((band: ChartPriceRange | undefined) => setPreviewBand(band, isReversed)),
    }),
    [setRange, setPreviewBand, isReversed],
  )
  return useMemo(() => ({ rangeBand, ...setters }), [rangeBand, setters])
}

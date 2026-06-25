import { atom } from 'jotai'
import { useUpdateAtom } from 'jotai/utils'
import { ReactElement, TouchEvent, useEffect, useMemo, useRef, useState } from 'react'
import { assertWebElement, ColorTokens, Flex, TamaguiElement, useMedia, useSporeColors } from 'ui/src'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ChartModel } from '~/components/Charts/ChartModelCore'
import type { ChartDataParams, ChartUtilParams } from '~/components/Charts/ChartModelCore'
import { ChartTooltip } from '~/components/Charts/ChartTooltip'
import { CustomHoverMarker } from '~/components/Charts/CustomHoverMarker'
import { useApplyChartTextureEffects } from '~/components/Charts/hooks/useApplyChartTextureEffects'
import { ChartModelWithLiveDot, LiveDotRenderer } from '~/components/Charts/LiveDotRenderer'
import { StaleBanner } from '~/components/Charts/StaleBanner'
import { SeriesDataItemType } from '~/components/Charts/types'
import { useOnClickOutside } from '~/hooks/useOnClickOutside'

export {
  ChartModel,
  DEFAULT_BOTTOM_PRICE_SCALE_MARGIN,
  DEFAULT_TOP_PRICE_SCALE_MARGIN,
} from '~/components/Charts/ChartModelCore'
export type { ChartHoverData, ChartModelParams } from '~/components/Charts/ChartModelCore'

/** Screen-space hover position passed to chart overlay render props. `plotRightEdge` marks where the price axis begins. */
export type ChartHoverCoordinates = { x: number; y: number; plotRightEdge?: number }

export const refitChartContentAtom = atom<(() => void) | undefined>(undefined)

type ChartTooltipBodyComponent<TDataType extends SeriesDataItemType> = React.FunctionComponent<{
  data: TDataType
}>

function handleSetAtomResult(result: void | Promise<void>): void {
  if (result) {
    result.catch(() => undefined)
  }
}

/** Returns a div injected with a lightweight-chart, corresponding to the given Model and params */
export function Chart<TParamType extends ChartDataParams<TDataType>, TDataType extends SeriesDataItemType>({
  Model,
  TooltipBody,
  params,
  height,
  children,
  onCrosshairChange,
  className,
  disableChartTouchPanning,
  showDottedBackground = false,
  showLeftFadeOverlay = false,
  showCustomHoverMarker = false,
  overrideColor,
}: {
  Model: new (chartDiv: HTMLDivElement, params: TParamType & ChartUtilParams<TDataType>) => ChartModel<TDataType>
  TooltipBody?: ChartTooltipBodyComponent<TDataType>
  params: TParamType
  height?: number
  children?: (crosshair?: TDataType, hover?: ChartHoverCoordinates | null) => ReactElement | null
  onCrosshairChange?: (crosshair?: TDataType) => void
  className?: string
  disableChartTouchPanning?: boolean // On touch devices, optionally disables chart touch panning on mobile devices to avoid interfering with vertical scrolling
  showDottedBackground?: boolean
  showLeftFadeOverlay?: boolean
  showCustomHoverMarker?: boolean
  overrideColor?: string // Optional token color override for accent1
}) {
  const setRefitChartContent = useUpdateAtom(refitChartContentAtom)
  // Lightweight-charts injects a canvas into the page through the div referenced below
  // It is stored in state to cause a re-render upon div mount, avoiding delay in chart creation
  const [chartDivElement, setChartDivElement] = useState<TamaguiElement | null>(null)
  const [crosshairData, setCrosshairData] = useState<TDataType | undefined>(undefined)
  const [hoverCoordinates, setHoverCoordinates] = useState<{ x: number; y: number } | null>(null)
  const [isZoomed, setIsZoomed] = useState(false)
  const format = useLocalizationContext()
  const sporeColors = useSporeColors()
  const locale = useCurrentLocale()
  const media = useMedia()
  const isLargeScreen = !media.lg
  const onCrosshairChangeRef = useRef(onCrosshairChange)

  useEffect(() => {
    onCrosshairChangeRef.current = onCrosshairChange
  }, [onCrosshairChange])

  const handleCrosshairMove = useMemo(
    () => (data: TDataType | undefined) => {
      setCrosshairData(data)
      onCrosshairChangeRef.current?.(data)
      if (chartModelRef.current) {
        const coords = chartModelRef.current.getHoverCoordinates()
        setHoverCoordinates(coords)
      } else {
        setHoverCoordinates(null)
      }
    },
    [],
  )

  const colors = useMemo(() => {
    const accent1Overrides = overrideColor
      ? { val: overrideColor as ColorTokens, get: () => overrideColor as ColorTokens }
      : {}

    return {
      ...sporeColors,
      accent1: {
        ...sporeColors.accent1,
        ...accent1Overrides,
      },
    }
  }, [sporeColors, overrideColor])

  const modelParams = useMemo(
    () => ({ ...params, format, colors, locale, isLargeScreen, onCrosshairMove: handleCrosshairMove }),
    [format, isLargeScreen, locale, params, colors, handleCrosshairMove],
  )

  // Create a stable key that changes when chart data changes (e.g., time period change)
  const dataKey = useMemo(() => {
    if (params.data.length === 0) {
      return undefined
    }
    const lastItem = params.data[params.data.length - 1]
    return JSON.stringify(lastItem)
  }, [params.data])

  // Chart model state should not affect React render cycles since the chart canvas is drawn outside of React, so we store via ref
  const chartModelRef = useRef<ChartModel<TDataType>>(undefined)
  // Track when chart model is ready to trigger re-render for LiveDotRenderer
  const [isChartModelReady, setIsChartModelReady] = useState(false)

  useApplyChartTextureEffects({ chartDivElement, showDottedBackground, showLeftFadeOverlay })

  // Creates the chart as soon as the chart div ref is defined
  useEffect(() => {
    if (chartDivElement && chartModelRef.current === undefined) {
      assertWebElement(chartDivElement)
      chartModelRef.current = new Model(chartDivElement, modelParams)
      // Provides the time period selector with a handle to refit the chart
      handleSetAtomResult(setRefitChartContent(() => () => chartModelRef.current?.fitContent()))
      // Trigger re-render so LiveDotRenderer can access the chart model
      setIsChartModelReady(true)
    }
  }, [Model, chartDivElement, modelParams, setRefitChartContent])

  // Track zoom state changes to hide live dot when zoomed
  useEffect(() => {
    if (!chartModelRef.current || !isChartModelReady) {
      return undefined
    }
    const updateZoomState = (): void => {
      setIsZoomed(chartModelRef.current?.isZoomed() ?? false)
    }
    updateZoomState()
    return chartModelRef.current.subscribeToVisibleRangeChange(updateZoomState)
  }, [isChartModelReady])

  // Keeps the chart up-to-date with latest data/params, without re-creating the entire chart
  useEffect(() => {
    chartModelRef.current?.updateOptions(modelParams)
  }, [modelParams])

  // Handles chart removal on unmount
  useEffect(() => {
    return () => {
      onCrosshairChangeRef.current?.(undefined)
      chartModelRef.current?.remove()
      // This ref's value will persist when being initially remounted in React.StrictMode.
      // The persisted IChartApi would err if utilized after calling remove(), so we manually clear the ref here.
      chartModelRef.current = undefined
      setIsChartModelReady(false)
      handleSetAtomResult(setRefitChartContent(undefined))
    }
  }, [setRefitChartContent])

  useOnClickOutside({
    node: { current: chartDivElement } as React.RefObject<HTMLDivElement | null>,
    handler: () => {
      setCrosshairData(undefined)
      onCrosshairChangeRef.current?.(undefined)
      setHoverCoordinates(null)
    },
  })

  // Update hover coordinates on crosshair data changes
  useEffect(() => {
    if (chartModelRef.current) {
      const coords = chartModelRef.current.getHoverCoordinates()
      setHoverCoordinates(coords)
    } else if (!crosshairData) {
      setHoverCoordinates(null)
    }
  }, [crosshairData])

  const touchMoveHandler = disableChartTouchPanning ? (e: TouchEvent<HTMLElement>) => e.stopPropagation() : undefined
  return (
    <Flex
      width="100%"
      position="relative"
      animation="fast"
      height={height}
      className={className}
      onTouchMove={touchMoveHandler as any} // any is used to avoid needing to import GestureResponderEvent from react-native
    >
      {/* Chart container */}
      <Flex ref={setChartDivElement} height={height} width="100%" position="relative">
        {/* Canvas is injected here by lightweight-charts */}
        {/* Background texture and fade overlay are applied directly to the chart td element */}
      </Flex>

      {/* Header/content outside background */}
      {children &&
        children(
          crosshairData,
          hoverCoordinates ? { ...hoverCoordinates, plotRightEdge: chartModelRef.current?.getPlotRightEdge() } : null,
        )}
      {TooltipBody && crosshairData && (
        <ChartTooltip id={chartModelRef.current?.tooltipId} includeBorder={!params.hideTooltipBorder}>
          <TooltipBody data={crosshairData} />
        </ChartTooltip>
      )}
      {params.stale && <StaleBanner />}
      {/* Custom hover marker */}
      {showCustomHoverMarker && hoverCoordinates && chartDivElement && chartModelRef.current && (
        <CustomHoverMarker coordinates={hoverCoordinates} lineColor={colors.accent1.val} />
      )}
      {/* Live dot indicator at the end of line charts - hidden when zoomed */}
      {chartDivElement && isChartModelReady && chartModelRef.current && (
        <LiveDotRenderer
          chartModel={chartModelRef.current as ChartModelWithLiveDot}
          isHovering={!!crosshairData}
          isZoomed={isZoomed}
          chartContainer={chartDivElement as HTMLDivElement}
          overrideColor={overrideColor}
          dataKey={dataKey}
        />
      )}
    </Flex>
  )
}

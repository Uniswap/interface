import { memo, useCallback, useEffect, useId, useMemo } from 'react'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  SharedValue,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Circle, Defs, G, Line, Path, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg'
import { scheduleOnRN } from 'react-native-worklets'
import { findNearestIndex, getYForX, parseSvgPath } from 'src/components/charts/sparklineUtils'
import { computeChartPaths, type ChartPoint } from 'uniswap/src/components/charts/computeChartPaths'

export type ChartData = ChartPoint[]

const AnimatedCircle = Animated.createAnimatedComponent(Circle)
const AnimatedLine = Animated.createAnimatedComponent(Line)

const STROKE_WIDTH = 1.5
const DOT_RADIUS = 5
const PULSE_MAX_RADIUS = 12
const PULSE_DURATION_MS = 2000
const SCRUB_DOT_RADIUS = 4
const SCRUB_LINE_WIDTH = 1
const SCRUB_ACTIVATION_DELAY_MS = 150
const SCRUB_MAX_DISTANCE = 999999
const INACTIVE_LINE_OPACITY = 0.2
const INACTIVE_AREA_OPACITY = 0.35

interface SparklineChartProps {
  data: ChartData
  width: number
  height: number
  color: string
  yGutter?: number
  showDot?: boolean
  dotStrokeColor?: string
  interactive?: boolean
  onScrub?: (point: ChartPoint | null) => void
  /** Parent-owned scrub state, written by the chart on the UI thread (e.g. to drive external worklet text) */
  scrubIndex?: SharedValue<number>
  scrubActive?: SharedValue<boolean>
  strokeWidth?: number
}

export const SparklineChart = memo(function SparklineChart({
  data,
  width,
  height,
  color,
  yGutter = 0,
  showDot = false,
  dotStrokeColor,
  interactive = false,
  onScrub,
  scrubIndex: providedScrubIndex,
  scrubActive: providedScrubActive,
  strokeWidth = STROKE_WIDTH,
}: SparklineChartProps): JSX.Element | null {
  const gradientId = `sparkline-gradient-${useId()}`
  // When showing the dot, reserve right padding so the pulse circle isn't clipped
  const rightPadding = showDot ? PULSE_MAX_RADIUS : 0
  const dataWidth = Math.max(width - rightPadding, 1)

  const scrubX = useSharedValue(-1)
  const internalScrubIndex = useSharedValue(-1)
  const internalScrubActive = useSharedValue(false)
  const scrubIndex = providedScrubIndex ?? internalScrubIndex
  const scrubActive = providedScrubActive ?? internalScrubActive

  // Preserve the min/max envelope per horizontal point, plus the endpoints.
  // Scrub indices still address the full-resolution history.
  const { linePath, areaPath, lastPoint, timestamps } = useMemo(
    () => computeChartPaths({ data, dataWidth, height, yGutter, maxPoints: 2 * Math.ceil(dataWidth) + 2 }),
    [data, dataWidth, height, yGutter],
  )

  const parsedSegments = useMemo(() => (linePath ? parseSvgPath(linePath) : null), [linePath])

  const scrubY = useDerivedValue(() => {
    if (!parsedSegments || scrubX.value < 0) {
      return 0
    }

    return getYForX(parsedSegments, Math.min(scrubX.value, dataWidth)) ?? 0
  })

  const handleScrubIndexChange = useCallback(
    (index: number) => {
      onScrub?.(data[index] ?? null)
    },
    [data, onScrub],
  )

  const handleScrubEnd = useCallback(() => {
    onScrub?.(null)
  }, [onScrub])

  useAnimatedReaction(
    () => scrubIndex.value,
    (currentIndex, previousIndex) => {
      if (currentIndex === previousIndex || currentIndex < 0 || currentIndex >= data.length) {
        return
      }

      scheduleOnRN(handleScrubIndexChange, currentIndex)
    },
    [data.length, handleScrubIndexChange],
  )

  const longPressGesture = useMemo(() => {
    const scrubAtX = (x: number): void => {
      'worklet'
      if (data.length < 2 || !timestamps) {
        return
      }
      const clampedX = Math.max(0, Math.min(x, dataWidth))
      scrubActive.value = true
      scrubX.value = clampedX
      scrubIndex.value = findNearestIndex({ timestamps, normalizedX: clampedX / dataWidth })
    }

    return (
      Gesture.LongPress()
        .minDuration(SCRUB_ACTIVATION_DELAY_MS)
        .maxDistance(SCRUB_MAX_DISTANCE)
        .shouldCancelWhenOutside(false)
        // show the cursor on a still hold — touch-move events alone never fire for a stationary finger
        .onStart((e) => {
          'worklet'
          scrubAtX(e.x)
        })
        .onTouchesMove((e) => {
          'worklet'
          const touch = e.allTouches[0]
          if (!touch) {
            return
          }
          scrubAtX(touch.x)
        })
        .onEnd(() => {
          'worklet'
          scrubActive.value = false
          scrubX.value = -1
          scrubIndex.value = -1
          scheduleOnRN(handleScrubEnd)
        })
        .onFinalize((_e, success) => {
          'worklet'
          if (success) {
            return
          }
          scrubActive.value = false
          scrubX.value = -1
          scrubIndex.value = -1
          scheduleOnRN(handleScrubEnd)
        })
    )
  }, [data.length, dataWidth, timestamps, handleScrubEnd, scrubActive, scrubIndex, scrubX])

  const clipStyle = useAnimatedStyle(() => ({
    width: scrubActive.value ? Math.max(0, Math.min(scrubX.value, dataWidth)) : width,
  }))

  const scrubLineProps = useAnimatedProps(() => ({
    x1: scrubX.value,
    y1: 0,
    x2: scrubX.value,
    y2: height,
    opacity: scrubActive.value ? 1 : 0,
  }))

  const scrubDotProps = useAnimatedProps(() => ({
    cx: scrubX.value,
    cy: scrubY.value,
    opacity: scrubActive.value ? 1 : 0,
  }))

  const liveDotProps = useAnimatedProps(() => ({
    opacity: scrubActive.value ? 0 : 1,
  }))

  if (!linePath || !areaPath) {
    return null
  }

  const gradient = (
    <Defs>
      <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor={color} stopOpacity={0.16} />
        <Stop offset="1" stopColor={color} stopOpacity={0} />
      </SvgLinearGradient>
    </Defs>
  )

  const brightPaths = (
    <>
      <Path d={areaPath} fill={`url(#${gradientId})`} />
      <Path d={linePath} stroke={color} strokeWidth={strokeWidth} fill="none" />
    </>
  )

  const livePoint = showDot && lastPoint && (
    <>
      <PulseDot cx={lastPoint.x} cy={lastPoint.y} color={color} hidden={interactive ? scrubActive : undefined} />
      {interactive ? (
        <AnimatedCircle
          animatedProps={liveDotProps}
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={DOT_RADIUS}
          fill={color}
          stroke={dotStrokeColor}
          strokeWidth={dotStrokeColor ? 2 : 0}
        />
      ) : (
        <Circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={DOT_RADIUS}
          fill={color}
          stroke={dotStrokeColor}
          strokeWidth={dotStrokeColor ? 2 : 0}
        />
      )}
    </>
  )

  if (!interactive) {
    return (
      <Svg width={width} height={height}>
        {gradient}
        <G>
          {brightPaths}
          {livePoint}
        </G>
      </Svg>
    )
  }

  return (
    <GestureDetector gesture={longPressGesture}>
      <Animated.View style={{ width, height }}>
        <Svg pointerEvents="none" width={width} height={height}>
          {gradient}
          <Path d={areaPath} fill={`url(#${gradientId})`} opacity={INACTIVE_AREA_OPACITY} />
          <Path
            d={linePath}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeOpacity={INACTIVE_LINE_OPACITY}
          />
        </Svg>
        {/* Keep the SVG bounds fixed; only its native parent changes the visible width. */}
        <Animated.View
          pointerEvents="none"
          style={[{ position: 'absolute', top: 0, left: 0, height, overflow: 'hidden' }, clipStyle]}
        >
          <Svg width={width} height={height}>
            {gradient}
            {brightPaths}
          </Svg>
        </Animated.View>
        {/* Animated SVG nodes redraw this overlay without invalidating the chart paths. */}
        <Svg pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0 }} width={width} height={height}>
          {livePoint}
          <AnimatedLine
            animatedProps={scrubLineProps}
            stroke={color}
            strokeWidth={SCRUB_LINE_WIDTH}
            strokeDasharray="4,3"
          />
          <AnimatedCircle
            animatedProps={scrubDotProps}
            r={SCRUB_DOT_RADIUS}
            fill={color}
            stroke={dotStrokeColor}
            strokeWidth={dotStrokeColor ? 2 : 0}
          />
        </Svg>
      </Animated.View>
    </GestureDetector>
  )
})

const PulseDot = memo(function PulseDot({
  cx,
  cy,
  color,
  hidden,
}: {
  cx: number
  cy: number
  color: string
  hidden?: SharedValue<boolean>
}): JSX.Element {
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: PULSE_DURATION_MS }), -1, false)
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- progress is a stable Reanimated SharedValue
  }, [])

  const animatedProps = useAnimatedProps(() => ({
    r: DOT_RADIUS + progress.value * (PULSE_MAX_RADIUS - DOT_RADIUS),
    opacity: hidden?.value ? 0 : 0.4 * (1 - progress.value),
  }))

  return <AnimatedCircle cx={cx} cy={cy} fill={color} animatedProps={animatedProps} />
})

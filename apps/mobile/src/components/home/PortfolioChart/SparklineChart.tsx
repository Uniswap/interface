import { memo, useCallback, useEffect, useId, useMemo } from 'react'
import {
  GestureEvent,
  LongPressGestureHandler,
  LongPressGestureHandlerEventPayload,
} from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  SharedValue,
  useAnimatedGestureHandler,
  useAnimatedProps,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  Line,
  Path,
  Rect,
  Stop,
  LinearGradient as SvgLinearGradient,
} from 'react-native-svg'
import {
  computeChartPaths,
  findNearestIndex,
  getYForX,
  parseSvgPath,
} from 'src/components/home/PortfolioChart/sparklineUtils'

type ChartPoint = { timestamp: number; value: number }
export type ChartData = ChartPoint[]

const AnimatedCircle = Animated.createAnimatedComponent(Circle)
const AnimatedLine = Animated.createAnimatedComponent(Line)
const AnimatedRect = Animated.createAnimatedComponent(Rect)

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
}: SparklineChartProps): JSX.Element | null {
  const gradientId = `sparkline-gradient-${useId()}`
  const clipPathId = `sparkline-clip-${useId()}`
  // When showing the dot, reserve right padding so the pulse circle isn't clipped
  const rightPadding = showDot ? PULSE_MAX_RADIUS : 0
  const dataWidth = Math.max(width - rightPadding, 1)

  const scrubX = useSharedValue(-1)
  const scrubIndex = useSharedValue(-1)
  const scrubActive = useSharedValue(false)

  const { linePath, areaPath, lastPoint, timestamps } = useMemo(
    () => computeChartPaths({ data, dataWidth, height, yGutter }),
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

      runOnJS(handleScrubIndexChange)(currentIndex)
    },
    [data.length, handleScrubIndexChange],
  )

  const onGestureEvent = useAnimatedGestureHandler<GestureEvent<LongPressGestureHandlerEventPayload>>(
    {
      onActive: ({ x }) => {
        if (data.length < 2 || !timestamps) {
          return
        }

        const clampedX = Math.max(0, Math.min(x, dataWidth))
        scrubActive.value = true
        scrubX.value = clampedX

        scrubIndex.value = findNearestIndex({ timestamps, normalizedX: clampedX / dataWidth })
      },
      onEnd: () => {
        scrubActive.value = false
        scrubX.value = -1
        scrubIndex.value = -1
        runOnJS(handleScrubEnd)()
      },
      onFail: () => {
        scrubActive.value = false
        scrubX.value = -1
        scrubIndex.value = -1
        runOnJS(handleScrubEnd)()
      },
      onCancel: () => {
        scrubActive.value = false
        scrubX.value = -1
        scrubIndex.value = -1
        runOnJS(handleScrubEnd)()
      },
    },
    [data.length, dataWidth, timestamps, handleScrubEnd, scrubActive, scrubIndex, scrubX],
  )

  const clipRectProps = useAnimatedProps(() => ({
    height,
    width: interactive && scrubActive.value ? scrubX.value : width,
    x: 0,
    y: 0,
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

  const chartContent = (
    <Svg width={width} height={height}>
      <Defs>
        <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0.16} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </SvgLinearGradient>
        {interactive && (
          <ClipPath id={clipPathId}>
            <AnimatedRect animatedProps={clipRectProps} />
          </ClipPath>
        )}
      </Defs>
      {interactive && (
        <>
          <Path d={areaPath} fill={`url(#${gradientId})`} opacity={INACTIVE_AREA_OPACITY} />
          <Path
            d={linePath}
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeOpacity={INACTIVE_LINE_OPACITY}
          />
        </>
      )}
      <G clipPath={interactive ? `url(#${clipPathId})` : undefined}>
        <Path d={areaPath} fill={`url(#${gradientId})`} />
        <Path d={linePath} stroke={color} strokeWidth={STROKE_WIDTH} fill="none" />
        {showDot && lastPoint && (
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
        )}
      </G>
      {interactive && (
        <>
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
        </>
      )}
    </Svg>
  )

  if (interactive) {
    return (
      <LongPressGestureHandler
        minDurationMs={SCRUB_ACTIVATION_DELAY_MS}
        maxDist={SCRUB_MAX_DISTANCE}
        shouldCancelWhenOutside={false}
        onGestureEvent={onGestureEvent}
      >
        <Animated.View style={{ width, height }}>{chartContent}</Animated.View>
      </LongPressGestureHandler>
    )
  }

  return chartContent
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

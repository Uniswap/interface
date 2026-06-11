import { ReactNode, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { LayoutChangeEvent } from 'react-native'
import { Dimensions, StyleSheet } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { ESTIMATED_BOTTOM_TABS_HEIGHT } from 'src/app/navigation/tabs/CustomTabBar/constants'
import { SectionName } from 'uniswap/src/features/telemetry/constants'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'

/** Horizontal swipe must exceed this before pan activates — keeps tap targets responsive. */
const ACTIVATION_OFFSET_X = 12
/** If vertical movement exceeds this first, the gesture fails so the outer FlatList can scroll. */
const FAIL_OFFSET_Y = 8
/** Fraction of page width past which a release commits to the next page. */
const PAGE_THRESHOLD_RATIO = 0.25
/** Fling velocity (px/s) past which a release commits regardless of distance. */
const VELOCITY_THRESHOLD = 800
const ANIMATION_DURATION = 220

/** Fallback when bottom tab bar height is unknown (see `ESTIMATED_BOTTOM_TABS_HEIGHT`). */
const BOTTOM_NAV_CLEARANCE_FALLBACK = 50

export interface HomeFeedPagerPage {
  key: (typeof SectionName)[keyof typeof SectionName]
  /** Latest measured natural height of the page's content; `0` until first layout. */
  height: number
  content: ReactNode
}

interface HomeFeedPagerProps {
  index: number
  onIndexChange: (index: number) => void
  onSwipeStart?: () => void
  pageWidth: number
  /** Fallback height used until a page reports its measured height. */
  fallbackHeight: number
  pages: ReadonlyArray<HomeFeedPagerPage>
}

/**
 * Custom horizontal pager built on `react-native-gesture-handler` + Reanimated.
 *
 * Replaces `react-native-tab-view` for the Home feed for two reasons:
 * 1. Vertical-pan pass-through: native PagerView's UIScrollView momentarily claimed
 *    vertical pans and blocked the outer Animated.FlatList from scrolling.
 *    Fixed via `activeOffsetX` + `failOffsetY` (mirrors `SwipeableCard.native.tsx`).
 * 2. Per-page height: pages render as absolutely-positioned siblings so the viewport
 *    can collapse to the active page's measured height — no whitespace below
 *    a shorter tab. The viewport height is interpolated from `translateX`, so it
 *    grows/shrinks smoothly while swiping between unequal-height pages.
 */
export const HomeFeedPager = memo(function HomeFeedPagerInner({
  index,
  onIndexChange,
  onSwipeStart,
  pageWidth,
  fallbackHeight,
  pages,
}: HomeFeedPagerProps): JSX.Element {
  const insets = useAppInsets()
  const bottomNavClearance =
    insets.bottom + ESTIMATED_BOTTOM_TABS_HEIGHT > 0
      ? insets.bottom + ESTIMATED_BOTTOM_TABS_HEIGHT
      : BOTTOM_NAV_CLEARANCE_FALLBACK
  const viewportRef = useRef<Animated.View>(null)
  const hasMeasuredViewportMinHeightRef = useRef(false)
  const [viewportMinHeight, setViewportMinHeight] = useState(0)

  const measureViewportMinHeight = useCallback(() => {
    if (hasMeasuredViewportMinHeightRef.current) {
      return
    }
    const screenHeight = Dimensions.get('window').height
    viewportRef.current?.measureInWindow((_x, y) => {
      hasMeasuredViewportMinHeightRef.current = true
      setViewportMinHeight(Math.max(0, Math.ceil(screenHeight - y - bottomNavClearance)))
    })
  }, [bottomNavClearance])

  const handleViewportLayout = useCallback(
    (_event: LayoutChangeEvent) => {
      measureViewportMinHeight()
    },
    [measureViewportMinHeight],
  )

  const translateX = useSharedValue(-index * pageWidth)
  const dragStartX = useSharedValue(0)
  /** Set on swipe-end so the JS-side index sync effect doesn't re-trigger withTiming. */
  const skipNextSyncEffect = useSharedValue(false)
  const numPages = pages.length

  /** Effective heights with fallback applied — primitives only so worklets can capture them. */
  const pageHeights = useMemo(
    () => pages.map((p) => (p.height > 0 ? p.height : fallbackHeight)),
    [pages, fallbackHeight],
  )

  useEffect(() => {
    if (skipNextSyncEffect.value) {
      skipNextSyncEffect.value = false
      return
    }
    translateX.value = withTiming(-index * pageWidth, { duration: ANIMATION_DURATION })
  }, [index, pageWidth, translateX, skipNextSyncEffect])

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-ACTIVATION_OFFSET_X, ACTIVATION_OFFSET_X])
        .failOffsetY([-FAIL_OFFSET_Y, FAIL_OFFSET_Y])
        .onStart(() => {
          dragStartX.value = translateX.value
          if (onSwipeStart) {
            runOnJS(onSwipeStart)()
          }
        })
        .onUpdate((e) => {
          const min = -(numPages - 1) * pageWidth
          const max = 0
          const next = Math.min(max, Math.max(min, dragStartX.value + e.translationX))
          translateX.value = next
        })
        .onEnd((e) => {
          const dx = e.translationX
          const vx = e.velocityX
          const threshold = pageWidth * PAGE_THRESHOLD_RATIO
          let nextIndex = index
          if (dx < -threshold || vx < -VELOCITY_THRESHOLD) {
            nextIndex = Math.min(numPages - 1, index + 1)
          } else if (dx > threshold || vx > VELOCITY_THRESHOLD) {
            nextIndex = Math.max(0, index - 1)
          }
          translateX.value = withTiming(-nextIndex * pageWidth, { duration: ANIMATION_DURATION })
          if (nextIndex !== index) {
            skipNextSyncEffect.value = true
            runOnJS(onIndexChange)(nextIndex)
          }
        }),
    [index, numPages, pageWidth, onIndexChange, dragStartX, translateX, skipNextSyncEffect, onSwipeStart],
  )

  const stripTransformStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }))

  /** Linearly interpolate viewport height between adjacent pages from translateX so the
   * row collapses to the active page's height at rest and follows the swipe in flight. */
  const viewportHeightStyle = useAnimatedStyle(() => {
    const positionFloat = Math.min(numPages - 1, Math.max(0, -translateX.value / pageWidth))
    const lowerIndex = Math.floor(positionFloat)
    const upperIndex = Math.min(numPages - 1, lowerIndex + 1)
    const fraction = positionFloat - lowerIndex
    const lowerH = pageHeights[lowerIndex] ?? fallbackHeight
    const upperH = pageHeights[upperIndex] ?? fallbackHeight
    return { height: lowerH + (upperH - lowerH) * fraction }
  }, [pageHeights, pageWidth, numPages, fallbackHeight, translateX])

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        ref={viewportRef}
        style={[
          styles.viewport,
          { width: pageWidth, minHeight: viewportMinHeight > 0 ? viewportMinHeight : undefined },
          viewportHeightStyle,
        ]}
        onLayout={handleViewportLayout}
      >
        {pages.map((page, i) => (
          <Animated.View
            key={page.key}
            style={[styles.page, { width: pageWidth, left: i * pageWidth }, stripTransformStyle]}
          >
            {page.content}
          </Animated.View>
        ))}
      </Animated.View>
    </GestureDetector>
  )
})

const styles = StyleSheet.create({
  viewport: {
    overflow: 'hidden',
  },
  page: {
    position: 'absolute',
    top: 0,
  },
})

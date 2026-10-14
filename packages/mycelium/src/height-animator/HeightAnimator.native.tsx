import { isTestEnv } from '@universe/environment'
import { withSporeCurve } from '@universe/tailwind/animations/reanimated'
import { useEffect, useRef, useState, type JSX } from 'react'
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { useEvent } from 'utilities/src/react/hooks'
import type { HeightAnimatorProps } from './HeightAnimatorProps'

/**
 * Native `HeightAnimator`: measured height on a Spore curve (`useAnimatedStyle`
 * + `onLayout`), same open/close contract as the web leg.
 *
 * `isTestEnv()` is process-constant, so the instant view below never swaps in
 * at runtime. `animationDisabled` stays on the animated view — switching
 * component type would remount children and reset the height. Reduced motion
 * is `ReduceMotion.System` inside `withSporeCurve`, so the OS setting jumps
 * to the target without a subscription or a remount.
 */
export function HeightAnimator(props: HeightAnimatorProps): JSX.Element {
  if (isTestEnv()) {
    return <InstantHeightAnimator {...props} />
  }
  return <AnimatedHeightAnimator {...props} />
}

/** Instant open/close */
function InstantHeightAnimator({
  open = true,
  useInitialHeight = false,
  unmountChildrenWhenCollapsed = false,
  id,
  children,
}: HeightAnimatorProps): JSX.Element {
  const lazyUnmount = shouldLazyUnmount(unmountChildrenWhenCollapsed, useInitialHeight)

  return (
    <View id={id} style={instantContainerStyle(open)}>
      {!lazyUnmount || open ? children : null}
    </View>
  )
}

function AnimatedHeightAnimator({
  open = true,
  useInitialHeight = false,
  animation = 'fast',
  animationDisabled = false,
  unmountChildrenWhenCollapsed = false,
  id,
  children,
}: HeightAnimatorProps): JSX.Element {
  const lazyUnmount = shouldLazyUnmount(unmountChildrenWhenCollapsed, useInitialHeight)
  const height = useSharedValue(0)
  // JS-side copy of the last target; `height.value` belongs to the UI thread.
  const targetRef = useRef(0)
  const [renderChildren, setRenderChildren] = useState(!lazyUnmount || open)
  const [measured, setMeasured] = useState<number | null>(null)
  // Visible from the first frame: stay at natural height until measured instead of painting 0.
  const [startsNatural] = useState(open && (useInitialHeight || animationDisabled))
  // Pinned: measure view absolute, animated height drives the container.
  const pinned = measured !== null || !startsNatural

  if (open && !renderChildren) {
    setRenderChildren(true)
  }
  if (animationDisabled && lazyUnmount && !open && renderChildren) {
    setRenderChildren(false)
  }

  const finishCollapse = useEvent(() => {
    if (open || !lazyUnmount) {
      return
    }
    setRenderChildren(false)
  })

  // Sole hook that closes over `height` — the compiler freezes a value once a hook
  // captures it, so later hooks route writes through here instead of touching `height.value`.
  const writeHeight = useEvent((next: number, options?: { animate?: boolean; unmountOnFinish?: boolean }) => {
    const unchanged = targetRef.current === next
    targetRef.current = next
    if (!options?.animate) {
      height.value = next
      return
    }
    // Don't replay a curve to the current target, unless its callback has to unmount.
    if (unchanged && !options.unmountOnFinish) {
      return
    }
    height.value = withSporeCurve(
      animation,
      next,
      options.unmountOnFinish
        ? (finished) => {
            'worklet'
            if (finished) {
              scheduleOnRN(finishCollapse)
            }
          }
        : undefined,
    )
  })

  // Runs while animationDisabled too, so re-enabling starts from what is on screen.
  useEffect(() => {
    if (measured === null) {
      return
    }
    const target = open ? measured : 0
    writeHeight(target, { animate: !animationDisabled, unmountOnFinish: lazyUnmount && !open })
  }, [open, measured, animationDisabled, lazyUnmount, writeHeight])

  // Measures while animationDisabled too: re-enabling keeps the measure view's
  // frame, so no onLayout would follow it.
  const handleLayout = useEvent((event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height
    // Ignore 0 until content has laid out, and after the children unmount.
    if (nextHeight < 0 || (nextHeight === 0 && (measured === null || !renderChildren))) {
      return
    }
    // Leaving natural height: start from where the content already is.
    if (!pinned) {
      writeHeight(nextHeight)
    }
    setMeasured(nextHeight)
  })

  const animatedStyle = useAnimatedStyle(() => ({ height: height.value }))
  const containerStyle = animationDisabled
    ? instantContainerStyle(open)
    : [styles.container, pinned ? animatedStyle : styles.open]

  return (
    <Animated.View id={id} style={containerStyle}>
      <View
        collapsable={false}
        style={!animationDisabled && pinned ? styles.measure : undefined}
        onLayout={handleLayout}
      >
        {renderChildren ? children : null}
      </View>
    </Animated.View>
  )
}

/** Same rule as the web leg: useInitialHeight keeps collapsed children mounted. */
function shouldLazyUnmount(unmountChildrenWhenCollapsed: boolean, useInitialHeight: boolean): boolean {
  return unmountChildrenWhenCollapsed && !useInitialHeight
}

/** Height auto when open, 0 when closed. Shared by the test stub and animationDisabled. */
function instantContainerStyle(open: boolean): Array<(typeof styles)[keyof typeof styles]> {
  return [styles.container, open ? styles.open : styles.closed]
}

const styles = StyleSheet.create({
  closed: { height: 0 },
  container: { overflow: 'hidden', width: '100%' },
  measure: { left: 0, position: 'absolute', right: 0, top: 0 },
  open: { height: 'auto' },
})

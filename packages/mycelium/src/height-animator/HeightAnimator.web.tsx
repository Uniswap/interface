import { isTestEnv } from '@universe/environment'
import { SPORE_ANIMATION_CURVE_CSS } from '@universe/tailwind/animations'
import { type JSX, type TransitionEvent, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useEvent } from 'utilities/src/react/hooks'
import { cn } from '../cn'
import { ENTER_PRESET_CLASSES } from '../compat/animations'
import { RESET_CLASSES } from '../compat/style-classes'
import { useMatchMedia } from '../compat/useMatchMedia'
import type { HeightAnimatorProps } from './HeightAnimatorProps'

/** Longest theme transition is `lazy` (500ms); wait slightly longer so height + layout settle before unmount. */
export const COLLAPSE_UNMOUNT_DELAY_MS = 550

/**
 * What the legacy Tamagui `View` wrapper contributes on web (react-native-web
 * view defaults) — same recreation as the Shimmer wrapper.
 */
const VIEW_CLASSES = `flex flex-col items-stretch basis-auto ${RESET_CLASSES} shrink-0 w-full`

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Reactive `prefers-reduced-motion: reduce` (OS-level "minimize motion")
 * subscription, false during SSR. Mid-session preference changes re-render,
 * so the instant path engages without a remount.
 */
function usePrefersReducedMotion(): boolean {
  return useMatchMedia(REDUCED_MOTION_QUERY)
}

/** Reading layout flushes pending style changes so `from` registers as the transition start value. */
function forceReflow(element: HTMLElement): void {
  element.getBoundingClientRect()
}

/**
 * Transition the element between two pixel heights. The forced reflow between
 * the writes makes the browser commit `fromPx` as the transition's start value
 * within a single task — including inside a rAF callback — so the observer
 * path below needs only a single rAF, not the double-rAF dance (that one is
 * only needed when the two values must register via the browser's natural
 * frame-to-frame style recalc, without a forced reflow).
 */
function animateHeight({ element, fromPx, toPx }: { element: HTMLElement; fromPx: number; toPx: number }): void {
  element.style.height = `${fromPx}px`
  forceReflow(element)
  element.style.height = `${toPx}px`
}

/**
 * Web `HeightAnimator`: a ResizeObserver on the content wrapper drives an
 * explicit pixel `height` on the outer container, animated by a CSS
 * `transition` (curve from `SPORE_ANIMATION_CURVE_CSS`) and snapped to `auto`
 * on `transitionend` so the container tracks content reflows while settled
 * open. Rebuilt off Tamagui under the same `ui/src` export (INFRA-3340).
 *
 * Height changes while already open (modal step changes, expanding sub-rows)
 * animate too: the observer clamps the container back to the previous
 * measured height, then transitions to the new one — the reason this is a
 * measured-height transition and not the CSS grid `0fr→1fr` trick, which
 * only animates the open/close edge.
 *
 * `prefers-reduced-motion: reduce` takes the same instant open/close path as
 * `animationDisabled` — one check here covers every consumer.
 */
export function HeightAnimator({
  open = true,
  useInitialHeight = false,
  // Renamed binding: `animation` is this component's own prop (name-compatible
  // with the legacy API), not a Tamagui preset — the migration gate's textual
  // backstop for the legacy prop-assignment shape must not match this line.
  animation: animationCurve = 'fast',
  styleProps,
  animationDisabled = false,
  unmountChildrenWhenCollapsed = false,
  id,
  children,
}: HeightAnimatorProps): JSX.Element {
  const lazyUnmount = Boolean(unmountChildrenWhenCollapsed && !useInitialHeight)
  const prefersReducedMotion = usePrefersReducedMotion()
  const skipAnimation = animationDisabled || prefersReducedMotion || isTestEnv()

  const outerRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  /** Last observed content height — the "before" value when a mid-open content change animates. */
  const lastMeasuredHeightRef = useRef<number | null>(null)
  /** Preserves last content height so reopen after lazy-unmount starts the transition before the remounted children measure. */
  const lastNonZeroMeasuredHeightRef = useRef(0)

  const [renderChildren, setRenderChildren] = useState(!lazyUnmount || open)
  // Height is written imperatively after mount (transitions need ordered
  // style writes with reflows in between), so the JSX style only carries the
  // frozen first-render value — React never diffs it, so it never clobbers
  // the imperative writes.
  const [initialHeight] = useState<'auto' | 0>(() => (open && (useInitialHeight || skipAnimation) ? 'auto' : 0))
  // The legacy component fades itself in on mount (Tamagui enterStyle
  // opacity 0). Frozen so a later re-render can never replay the enter
  // animation by removing and re-adding the class.
  // Caveat: on an SSR/hydrated page the first render sees the false server
  // snapshot, so a reduced-motion user still gets the one-time mount fade
  // (the height path is unaffected; no current consumer is SSR).
  const [enterClass] = useState(() => (skipAnimation ? undefined : ENTER_PRESET_CLASSES.fadeIn))

  const handleContentResize = useEvent((measuredHeight: number): void => {
    const previousHeight = lastMeasuredHeightRef.current
    lastMeasuredHeightRef.current = measuredHeight
    if (measuredHeight > 0) {
      lastNonZeroMeasuredHeightRef.current = measuredHeight
    }

    const outer = outerRef.current
    if (!outer || !open || skipAnimation || measuredHeight === previousHeight) {
      return
    }

    if (outer.style.height === 'auto') {
      // Reached only when the observer's pin did not run: the first
      // measurement (stay settled), or a transition that settled to auto
      // between the notification and this frame.
      if (previousHeight === null) {
        return
      }
      animateHeight({ element: outer, fromPx: previousHeight, toPx: measuredHeight })
      return
    }

    // Opening (or retargeting an in-flight transition): drive toward the new
    // content height from wherever the animation currently is.
    outer.style.height = `${measuredHeight}px`
  })

  useLayoutEffect(() => {
    const content = contentRef.current
    if (!content || typeof ResizeObserver === 'undefined') {
      return undefined
    }
    // Owned by this effect: at most one pending frame; superseded or cleaned
    // up on every exit path below.
    let frameId: number | null = null
    const observer = new ResizeObserver((entries) => {
      const entry = entries[entries.length - 1]
      if (!entry) {
        return
      }
      // Border-box first with a content-box fallback: identical here because
      // VIEW_CLASSES zeroes border and padding on the content wrapper (any
      // future padding there would make the two disagree).
      const measuredHeight = entry.borderBoxSize[0]?.blockSize ?? entry.contentRect.height
      const outer = outerRef.current
      const previousHeight = lastMeasuredHeightRef.current
      // At height:auto the new size would paint for a frame before the rAF
      // transition; pin to the previous height here, before paint. Safe inside
      // the notification: it doesn't resize the observed wrapper. The
      // transition itself stays on rAF, since resizing observed elements in
      // here trips Chrome's "ResizeObserver loop completed with undelivered
      // notifications" error — which a pin inside a nested animator can still do.
      if (
        !skipAnimation &&
        outer &&
        outer.style.height === 'auto' &&
        previousHeight !== null &&
        measuredHeight !== previousHeight
      ) {
        outer.style.height = `${previousHeight}px`
      }
      // Superseding any pending frame coalesces bursts to the latest measurement.
      if (frameId !== null) {
        cancelAnimationFrame(frameId)
      }
      frameId = requestAnimationFrame(() => {
        frameId = null
        handleContentResize(measuredHeight)
      })
    })
    observer.observe(content)
    return () => {
      observer.disconnect()
      if (frameId !== null) {
        cancelAnimationFrame(frameId)
        frameId = null
      }
    }
  }, [handleContentResize, skipAnimation])

  useLayoutEffect(() => {
    const outer = outerRef.current
    if (!outer) {
      return
    }

    if (skipAnimation) {
      outer.style.height = open ? 'auto' : '0px'
      return
    }

    if (open) {
      if (outer.style.height === 'auto') {
        return
      }
      const contentHeight = contentRef.current?.offsetHeight ?? 0
      const target = contentHeight > 0 ? contentHeight : lastNonZeroMeasuredHeightRef.current
      if (target > 0) {
        animateHeight({ element: outer, fromPx: outer.getBoundingClientRect().height, toPx: target })
      }
      // target === 0: children are not measurable yet (e.g. remounting after
      // lazy unmount with no remembered height) — the ResizeObserver starts
      // the transition once they lay out.
      return
    }

    if (outer.style.height !== '0px') {
      animateHeight({ element: outer, fromPx: outer.getBoundingClientRect().height, toPx: 0 })
    }
  }, [open, skipAnimation])

  useLayoutEffect(() => {
    if (!lazyUnmount) {
      setRenderChildren(true)
      return
    }

    if (skipAnimation) {
      setRenderChildren(open)
      return
    }

    if (open) {
      setRenderChildren(true)
    }
  }, [open, lazyUnmount, skipAnimation])

  useEffect(() => {
    if (!lazyUnmount || skipAnimation || open) {
      return undefined
    }

    const timeoutId = setTimeout(() => {
      setRenderChildren(false)
    }, COLLAPSE_UNMOUNT_DELAY_MS)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [open, lazyUnmount, skipAnimation])

  const handleTransitionEnd = (event: TransitionEvent<HTMLDivElement>): void => {
    const outer = outerRef.current
    if (!outer || event.target !== outer || event.propertyName !== 'height') {
      return
    }
    // Snap to auto once fully open so content reflows the observer misses
    // (fonts, window resize) can never clip. Collapsed stays at 0.
    if (open && !skipAnimation) {
      outer.style.height = 'auto'
    }
  }

  return (
    // oxlint-disable-next-line react/forbid-elements -- the animator is a bare container driven by imperative height writes (mycelium's layout primitives are out of scope here)
    <div
      ref={outerRef}
      id={id}
      className={cn(VIEW_CLASSES, 'overflow-hidden', enterClass)}
      // Height only, never `all` — a broader transition would flash color tokens on theme toggle (repo CLAUDE.md rule).
      style={{
        height: initialHeight,
        transition: skipAnimation ? undefined : `height ${SPORE_ANIMATION_CURVE_CSS[animationCurve]}`,
        ...styleProps?.['$platform-web'],
      }}
      onTransitionEnd={handleTransitionEnd}
    >
      {/* oxlint-disable-next-line react/forbid-elements -- bare measurement wrapper observed by the ResizeObserver */}
      <div ref={contentRef} className={VIEW_CLASSES}>
        {renderChildren ? children : null}
      </div>
    </div>
  )
}

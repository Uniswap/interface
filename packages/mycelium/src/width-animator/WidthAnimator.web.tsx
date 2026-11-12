import { isTestEnv } from '@universe/environment'
import { SPORE_ANIMATION_CURVE_CSS } from '@universe/tailwind/animations'
import { type JSX, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useEvent } from 'utilities/src/react/hooks'
import { cn } from '../cn'
import { ENTER_PRESET_CLASSES } from '../compat/animations'
import { RESET_CLASSES } from '../compat/style-classes'
import type { WidthAnimatorProps } from './WidthAnimatorProps'

/**
 * The legacy component hardcoded the `fast` animation preset and released
 * overflow on a timer matching that curve's 100ms duration — both kept in
 * lockstep here.
 */
const FAST_CURVE_CSS = SPORE_ANIMATION_CURVE_CSS.fast
export const FAST_ANIMATION_DURATION_MS = 100

/**
 * What the legacy Tamagui `View` wrapper contributes on web (react-native-web
 * view defaults) — same recreation as the HeightAnimator wrapper, minus
 * `w-full` (width is the animated property).
 */
const VIEW_CLASSES = `flex flex-col items-stretch basis-auto ${RESET_CLASSES} shrink-0`

/**
 * Web `WidthAnimator`: a fixed-height container whose width transitions
 * between 0 and `contentWidth` on a CSS transition — the width value is plain
 * React state, so there is no imperative retargeting like the HeightAnimator
 * needs for its `auto` snap. The measurement path is inert by construction
 * (see `WidthAnimatorProps.contentWidth`), kept bug-compatible with the
 * legacy component. Rebuilt off Tamagui under the same `ui/src` export
 * (INFRA-3592).
 *
 * Overflow is released 100ms after opening (once the transition has settled)
 * and re-clipped immediately on close, matching the legacy timer.
 */
export function WidthAnimator({
  open = true,
  height,
  contentWidth,
  mt,
  animationDisabled = false,
  styleProps,
  children,
}: WidthAnimatorProps): JSX.Element {
  const skipAnimation = animationDisabled || isTestEnv()

  // Legacy-faithful seed; inert in practice — visibleWidth prefers contentWidth whenever it is set.
  const [measuredWidth, setMeasuredWidth] = useState(contentWidth ?? 0)
  const [overflow, setOverflow] = useState<'hidden' | 'visible'>(() => (skipAnimation && open ? 'visible' : 'hidden'))
  const overflowRef = useRef(overflow)
  overflowRef.current = overflow
  // The outer box's settled post-flex-shrink width, for the fixed-width inner content only — the
  // outer must keep requesting the unclamped `contentWidth` or it could never grow back on resize.
  const [settledWidth, setSettledWidth] = useState(contentWidth ?? 0)
  const visibleWidth = contentWidth ?? measuredWidth
  const innerWidth = contentWidth !== undefined ? settledWidth : measuredWidth
  const outerRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  // The legacy component fades itself in on mount. Frozen so a later re-render
  // can never replay the enter animation by removing and re-adding the class.
  const [enterClass] = useState(() => (skipAnimation ? undefined : ENTER_PRESET_CLASSES.fadeIn))

  useEffect(() => {
    if (!open) {
      setOverflow('hidden')
      return undefined
    }
    if (skipAnimation) {
      // No transition to wait out — release overflow synchronously so consumer
      // tests never see a stray timer fire outside act().
      setOverflow('visible')
      return undefined
    }
    const timeoutId = setTimeout(() => setOverflow('visible'), FAST_ANIMATION_DURATION_MS)
    return () => clearTimeout(timeoutId)
  }, [open, skipAnimation])

  // Sync at transition end (= overflow release): the ResizeObserver's final notification races the
  // overflow-release timeout and its measurement is lost when it fires first.
  useLayoutEffect(() => {
    if (overflow !== 'visible' || contentWidth === undefined) {
      return
    }
    const width = outerRef.current?.getBoundingClientRect().width ?? 0
    if (width > 0) {
      setSettledWidth(width)
    }
  }, [overflow, contentWidth])

  // Track viewport resizes via the outer's rendered width (reflects flex-shrink, unlike
  // `contentWidth`); commit only once settled so the inner never reflows mid-transition.
  useLayoutEffect(() => {
    const outer = outerRef.current
    if (!outer || contentWidth === undefined || typeof ResizeObserver === 'undefined') {
      return undefined
    }
    let frameId: number | null = null
    const observer = new ResizeObserver((entries) => {
      const entry = entries[entries.length - 1]
      if (!entry) {
        return
      }
      const borderBoxSize = entry.borderBoxSize as readonly ResizeObserverSize[] | undefined
      const width = borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width
      if (frameId !== null) {
        cancelAnimationFrame(frameId)
      }
      frameId = requestAnimationFrame(() => {
        frameId = null
        if (width > 0 && overflowRef.current === 'visible') {
          setSettledWidth(width)
        }
      })
    })
    observer.observe(outer)
    return () => {
      observer.disconnect()
      if (frameId !== null) {
        cancelAnimationFrame(frameId)
      }
    }
  }, [contentWidth])

  const handleContentResize = useEvent((width: number): void => {
    // Zero widths are ignored, and an explicit contentWidth wins outright (legacy guard).
    if (width > 0 && contentWidth === undefined) {
      setMeasuredWidth(width)
    }
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
      // Typed always-present, but older engines and bare test stubs omit it —
      // widen so the contentRect fallback stays reachable.
      const borderBoxSize = entry.borderBoxSize as readonly ResizeObserverSize[] | undefined
      const width = borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width
      // The state write must not run inside the observer's notification — the
      // container's width follows the measurement, which is the trigger for
      // Chrome's "ResizeObserver loop completed with undelivered
      // notifications" error (HeightAnimator.web.tsx defers the same way).
      // Superseding any pending frame coalesces bursts to the latest
      // measurement.
      if (frameId !== null) {
        cancelAnimationFrame(frameId)
      }
      frameId = requestAnimationFrame(() => {
        frameId = null
        handleContentResize(width)
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
  }, [handleContentResize])

  return (
    // oxlint-disable-next-line react/forbid-elements -- the animator is a bare container driven by transitioned style values (mycelium's layout primitives are out of scope here)
    <div
      ref={outerRef}
      // TODO(INFRA-4589): collapsing only sets width 0, so focusable children stay in the tab order and the
      // accessibility tree; make the collapsed content inert.
      className={cn(VIEW_CLASSES, enterClass)}
      // Explicit property list, never `all` — a broader transition would flash
      // color tokens on theme toggle (repo CLAUDE.md rule). height and
      // margin-top are included because the legacy Tamagui driver animated
      // every changed layout prop, and the call site mutates both.
      style={{
        height,
        marginTop: mt,
        overflow,
        transition: skipAnimation
          ? undefined
          : `width ${FAST_CURVE_CSS}, height ${FAST_CURVE_CSS}, margin-top ${FAST_CURVE_CSS}`,
        width: open ? visibleWidth : 0,
        ...styleProps?.['$platform-web'],
      }}
    >
      {/* With contentWidth, fixed at the settled width so children never reflow mid-transition —
          the overflow clip does the revealing. Without it (legacy self-measuring path), tracks the
          outer (100%) so the ResizeObserver can measure the content. */}
      {/* oxlint-disable-next-line react/forbid-elements -- bare measurement wrapper observed by the ResizeObserver */}
      <div
        ref={contentRef}
        className={cn(VIEW_CLASSES, 'absolute h-full', contentWidth === undefined && 'w-full')}
        style={contentWidth !== undefined ? { width: innerWidth } : undefined}
      >
        {children}
      </div>
    </div>
  )
}

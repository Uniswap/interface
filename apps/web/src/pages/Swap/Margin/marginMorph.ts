import { curveToAnimationTiming } from '@universe/mycelium/compat'
import { SPORE_ANIMATION_CURVE_CSS } from '@universe/tailwind/animations'
import { useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { SwapTab } from 'uniswap/src/types/screens/interface'

// Two-phase swap↔margin cross-fade: the old view fades out, the committed view switches at the hidden
// trough (so the form never swaps mid-fade), then the new view fades in with form and chart converging
// from the sides. displayTab/displayIsTerminal lag the live state by the fade-out; non-margin tabs
// commit at once.
const MARGIN_FORM_FADE_OUT_MS = 200 // phase 1
// Blank beat after the commit so the chart mounts at a stable size before the fade-in (a few frames).
const MARGIN_CHART_LOAD_HOLD_MS = 70
const MARGIN_FADE_IN_MS = 240 // phase 2
const MARGIN_SHIFT_PX = 20 // form/chart converge over the fade from opposite sides
// Spore 'fast' ease-out bezier (Animation Guidelines' Translation curve); reuse the timing only.
const MARGIN_MORPH_EASING = curveToAnimationTiming(SPORE_ANIMATION_CURVE_CSS.fast).animationTimingFunction

interface MarginView {
  tab: SwapTab
  isTerminal: boolean
}

/**
 * Cross-fades the whole view (chart + form). Attach `viewRef` to the view root and render from
 * `displayTab`/`displayIsTerminal` (not the live values). `animateMorph` false commits instantly.
 */
export function useMarginViewTransition({
  currentTab,
  isTerminal,
  animateMorph,
}: {
  currentTab: SwapTab
  isTerminal: boolean
  animateMorph: boolean
}): {
  viewRef: RefObject<HTMLDivElement | null>
  formRef: RefObject<HTMLDivElement | null>
  chartRef: RefObject<HTMLDivElement | null>
  displayTab: SwapTab
  displayIsTerminal: boolean
} {
  // viewRef carries the opacity fade; formRef/chartRef carry the directional translate on top of it.
  const viewRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<MarginView>({ tab: currentTab, isTerminal })
  const prevIsTerminal = useRef(isTerminal)
  const anims = useRef<Animation[]>([])
  const commitTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  // True when the commit belongs to a cross-fade, so the [view] effect fades the new view in.
  const pendingFadeIn = useRef(false)

  const cancelAnims = (): void => {
    anims.current.forEach((a) => a.cancel())
    anims.current = []
  }

  // Phase 1: fade the old view out (held by `forwards`) while the form slides aside, commit at the trough.
  useLayoutEffect(() => {
    const terminalFlip = prevIsTerminal.current !== isTerminal
    prevIsTerminal.current = isTerminal
    const node = viewRef.current

    cancelAnims()
    if (commitTimer.current !== undefined) {
      clearTimeout(commitTimer.current)
      commitTimer.current = undefined
    }

    // Only an animated margin entrance/exit defers; swap/limit/buy/sell commit immediately.
    if (!animateMorph || !terminalFlip || !node) {
      pendingFadeIn.current = false
      setView({ tab: currentTab, isTerminal })
      return undefined
    }

    // Exit right entering the terminal, left leaving it (the new form always comes in from the right).
    const exitShift = isTerminal ? MARGIN_SHIFT_PX : -MARGIN_SHIFT_PX
    const out = { duration: MARGIN_FORM_FADE_OUT_MS, fill: 'forwards' as const }
    anims.current.push(node.animate([{ opacity: 1, easing: MARGIN_MORPH_EASING }, { opacity: 0 }], out))
    if (formRef.current) {
      anims.current.push(
        formRef.current.animate(
          [{ transform: 'translateX(0)', easing: MARGIN_MORPH_EASING }, { transform: `translateX(${exitShift}px)` }],
          out,
        ),
      )
    }
    commitTimer.current = setTimeout(() => {
      pendingFadeIn.current = true
      setView({ tab: currentTab, isTerminal })
    }, MARGIN_FORM_FADE_OUT_MS)

    return () => {
      cancelAnims()
      if (commitTimer.current !== undefined) {
        clearTimeout(commitTimer.current)
      }
    }
  }, [currentTab, isTerminal, animateMorph])

  // Phase 2: after the committed view mounts, hold it hidden (so the chart sizes), then fade in with the
  // form and chart converging. `backwards` fill keeps it hidden and offset through the load hold.
  useLayoutEffect(() => {
    if (!pendingFadeIn.current) {
      return undefined
    }
    pendingFadeIn.current = false
    cancelAnims()
    const opts = { duration: MARGIN_FADE_IN_MS, delay: MARGIN_CHART_LOAD_HOLD_MS, fill: 'backwards' as const }
    if (viewRef.current) {
      anims.current.push(viewRef.current.animate([{ opacity: 0, easing: MARGIN_MORPH_EASING }, { opacity: 1 }], opts))
    }
    if (formRef.current) {
      anims.current.push(
        formRef.current.animate(
          [
            // Always in from the right (right → left into place), whichever way the old form exited.
            { transform: `translateX(${MARGIN_SHIFT_PX}px)`, easing: MARGIN_MORPH_EASING },
            { transform: 'translateX(0)' },
          ],
          opts,
        ),
      )
    }
    if (chartRef.current) {
      anims.current.push(
        chartRef.current.animate(
          [
            { transform: `translateX(${-MARGIN_SHIFT_PX}px)`, easing: MARGIN_MORPH_EASING },
            { transform: 'translateX(0)' },
          ],
          opts,
        ),
      )
    }
    return undefined
  }, [view])

  return { viewRef, formRef, chartRef, displayTab: view.tab, displayIsTerminal: view.isTerminal }
}

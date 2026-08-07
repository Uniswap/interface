import { useCallback, useEffect, useRef, useState } from 'react'
import { useEvent } from 'utilities/src/react/hooks'
import { CAROUSEL_CARD_GAP } from '~/components/TokenCardCarousel/constants'

/** Constant marquee drift speed. */
const MARQUEE_SPEED_PX_PER_S = 30
/** Cap per-frame steps so a backgrounded tab doesn't jump ahead on resume. */
const MAX_FRAME_DELTA_MS = 100
/** Keep the marquee paused briefly after a touch so momentum scrolling can settle. */
const TOUCH_RESUME_DELAY_MS = 1500

/** Width of a single (un-duplicated) strip of `itemCount` cards, including the gaps between them. */
function getStripWidth({ itemCount, cardWidth }: { itemCount: number; cardWidth: number }): number {
  if (itemCount <= 0) {
    return 0
  }
  return itemCount * cardWidth + (itemCount - 1) * CAROUSEL_CARD_GAP
}

/**
 * Continuous marquee auto-scroll for the trending carousel: drifts the scroll container at a
 * constant speed and wraps seamlessly over a duplicated card strip. Hover (via `pause`/`resume`),
 * touch, and keyboard focus all suspend the drift so every existing interaction — card clicks,
 * manual scroll, the hover arrows — behaves exactly as it does today while the pointer is over the
 * row. Inactive (so the row renders exactly as before) while loading, when the cards don't
 * overflow the viewport, or when the user prefers reduced motion.
 */
export function useTrendingMarquee({
  itemCount,
  cardWidth,
  isLoading,
}: {
  itemCount: number
  cardWidth: number
  isLoading: boolean
}): {
  setScrollEl: (node: HTMLDivElement | null) => void
  /** True while the marquee is running; the consumer duplicates the card strip for the seamless wrap. */
  isMarqueeActive: boolean
  pause: () => void
  resume: () => void
} {
  const [scrollEl, setScrollElState] = useState<HTMLDivElement | null>(null)
  const setScrollEl = useCallback((node: HTMLDivElement | null) => {
    setScrollElState(node)
  }, [])

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [clientWidth, setClientWidth] = useState(0)
  // Pause reasons are refs (read inside the rAF loop) so pausing never re-renders the strip.
  const pauseReasonsRef = useRef({ hover: false, touch: false, focus: false })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)
    const handler = (event: MediaQueryListEvent): void => setPrefersReducedMotion(event.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (!scrollEl) {
      return undefined
    }
    const updateWidth = (): void => setClientWidth(scrollEl.clientWidth)
    updateWidth()
    const resizeObserver = new ResizeObserver(updateWidth)
    resizeObserver.observe(scrollEl)
    return () => resizeObserver.disconnect()
  }, [scrollEl])

  const isMarqueeActive =
    !isLoading && !prefersReducedMotion && clientWidth > 0 && getStripWidth({ itemCount, cardWidth }) > clientWidth + 1

  useEffect(() => {
    if (!isMarqueeActive || !scrollEl) {
      return undefined
    }

    let frame: number
    let lastTimestamp: number | undefined
    let touchResumeTimer: ReturnType<typeof setTimeout> | undefined
    // Float accumulator for the drift position: browsers quantize `scrollLeft` writes, so feeding
    // sub-pixel per-frame steps back through `scrollLeft` would round them away and the drift
    // would crawl or never start. Null = re-seed from the DOM on the next running frame (after a
    // pause, the user may have scrolled).
    let position: number | null = null

    const pauseReasons = pauseReasonsRef.current
    // Re-derive focus on (re)attach so an effect re-run can't carry a stale flag — latched true
    // would freeze the marquee; stale false would drift it under a focused card.
    pauseReasons.focus = scrollEl.contains(document.activeElement)
    // Same for hover: the component's mouse handlers are inert while the row loads, so a pointer
    // already resting on the row when the marquee attaches would otherwise go undetected and the
    // row would drift under it until the next mouseenter.
    pauseReasons.hover = scrollEl.matches(':hover')

    const step = (timestamp: number): void => {
      frame = requestAnimationFrame(step)
      const deltaMs = lastTimestamp === undefined ? 0 : Math.min(timestamp - lastTimestamp, MAX_FRAME_DELTA_MS)
      lastTimestamp = timestamp

      const { hover, touch, focus } = pauseReasons
      if (deltaMs === 0 || hover || touch || focus) {
        position = null
        return
      }

      // Distance between a card and its clone — measured from the DOM so the wrap stays seamless
      // regardless of rounding in the card/gap math.
      const children = scrollEl.children
      if (children.length <= itemCount) {
        return
      }
      const loopWidth = (children[itemCount] as HTMLElement).offsetLeft - (children[0] as HTMLElement).offsetLeft
      if (loopWidth <= 0) {
        return
      }

      // Re-seed when the DOM position diverged from the accumulator (external scroll that didn't
      // go through a pause, e.g. momentum tail); the tolerance absorbs scrollLeft quantization.
      const current =
        position !== null && Math.abs(scrollEl.scrollLeft - position) <= 2 ? position : scrollEl.scrollLeft
      let next = current + (MARQUEE_SPEED_PX_PER_S * deltaMs) / 1000
      if (next >= loopWidth) {
        next -= loopWidth
      }
      position = next
      scrollEl.scrollLeft = next
    }

    const clearTouchResumeTimer = (): void => {
      if (touchResumeTimer) {
        clearTimeout(touchResumeTimer)
        touchResumeTimer = undefined
      }
    }
    const onTouchStart = (): void => {
      clearTouchResumeTimer()
      pauseReasonsRef.current.touch = true
    }
    const onTouchEnd = (): void => {
      clearTouchResumeTimer()
      touchResumeTimer = setTimeout(() => {
        pauseReasonsRef.current.touch = false
      }, TOUCH_RESUME_DELAY_MS)
    }
    const onFocusIn = (): void => {
      pauseReasonsRef.current.focus = true
    }
    const onFocusOut = (): void => {
      pauseReasonsRef.current.focus = false
    }

    scrollEl.addEventListener('touchstart', onTouchStart, { passive: true })
    scrollEl.addEventListener('touchend', onTouchEnd, { passive: true })
    scrollEl.addEventListener('touchcancel', onTouchEnd, { passive: true })
    scrollEl.addEventListener('focusin', onFocusIn)
    scrollEl.addEventListener('focusout', onFocusOut)
    frame = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(frame)
      clearTouchResumeTimer()
      // Flags owned by this effect's listeners must not outlive them — clearing the resume timer
      // without resetting `touch` would otherwise latch the pause across an effect re-run. `hover`
      // stays: it's owned by the component's mouse handlers, which remain mounted.
      pauseReasons.touch = false
      pauseReasons.focus = false
      scrollEl.removeEventListener('touchstart', onTouchStart)
      scrollEl.removeEventListener('touchend', onTouchEnd)
      scrollEl.removeEventListener('touchcancel', onTouchEnd)
      scrollEl.removeEventListener('focusin', onFocusIn)
      scrollEl.removeEventListener('focusout', onFocusOut)
    }
  }, [isMarqueeActive, scrollEl, itemCount])

  const pause = useEvent((): void => {
    pauseReasonsRef.current.hover = true
  })

  const resume = useEvent((): void => {
    pauseReasonsRef.current.hover = false
  })

  return { setScrollEl, isMarqueeActive, pause, resume }
}

import { Flex, type FlexProps, type MyceliumElement } from '@universe/mycelium'
import { type ReactNode, useCallback, useEffect, useState } from 'react'
import { EDGE_FADE_WIDTH_PX, edgeFadeMaskStyle, useHorizontalScrollFades } from '~/hooks/useHorizontalScrollFades'

const PRESSABLE_SELECTOR = 'button, a, [role="button"], [role="link"], [role="tab"]'
/** Leaves the next item partly visible past the fade, so the row reads as scrollable. */
const NEXT_ITEM_PEEK_PX = 32
const SCROLL_PADDING_PX = EDGE_FADE_WIDTH_PX + NEXT_ITEM_PEEK_PX
const SCROLL_PADDING_STYLE = { scrollPaddingInline: SCROLL_PADDING_PX }
/** Native smooth scrolling has no duration control and feels sluggish on short hops. */
const SCROLL_INTO_VIEW_MS = 250
/** Outlasts the 200ms chip transitions. */
const RESIZE_FOLLOW_MS = 400

type HorizontalFadeScrollerProps = Omit<FlexProps, 'ref' | 'row' | 'style' | 'className' | '$platform-web'> & {
  children: ReactNode
}

/** Horizontally scrolling row with edge fades; a pressed item near either edge scrolls into view. */
export function HorizontalFadeScroller({ children, ...flexProps }: HorizontalFadeScrollerProps): JSX.Element {
  const { scrollerRef, edgeFades } = useHorizontalScrollFades()
  const [node, setNode] = useState<MyceliumElement | null>(null)
  const ref = useCallback(
    (element: MyceliumElement | null): void => {
      scrollerRef(element)
      setNode(element)
    },
    [scrollerRef],
  )

  useEffect(() => {
    if (!(node instanceof HTMLElement)) {
      return undefined
    }
    let stopFollowing: (() => void) | undefined
    let frame: number | undefined
    const scrollIntoView = (item: Element): void => {
      if (frame !== undefined) {
        cancelAnimationFrame(frame)
      }
      const from = node.scrollLeft
      const to = getNearestScrollLeft(node, item)
      if (to === from) {
        return
      }
      if (globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        node.scrollLeft = to
        return
      }
      const start = performance.now()
      const step = (now: number): void => {
        const progress = Math.min((now - start) / SCROLL_INTO_VIEW_MS, 1)
        node.scrollLeft = from + (to - from) * easeOutCubic(progress)
        frame = progress < 1 ? requestAnimationFrame(step) : undefined
      }
      frame = requestAnimationFrame(step)
    }
    // Capture phase: TouchableArea stops press propagation.
    const onClick = (event: MouseEvent): void => {
      const pressable = event.target instanceof Element ? event.target.closest(PRESSABLE_SELECTOR) : null
      if (!pressable || !node.contains(pressable)) {
        return
      }
      stopFollowing?.()
      scrollIntoView(pressable)
      // A selected item can grow (e.g. an expanding info icon), which would eat the peek.
      const observer = new ResizeObserver(() => scrollIntoView(pressable))
      observer.observe(pressable)
      const timeout = setTimeout(() => observer.disconnect(), RESIZE_FOLLOW_MS)
      stopFollowing = (): void => {
        observer.disconnect()
        clearTimeout(timeout)
      }
    }
    node.addEventListener('click', onClick, { capture: true })
    return () => {
      node.removeEventListener('click', onClick, { capture: true })
      stopFollowing?.()
      if (frame !== undefined) {
        cancelAnimationFrame(frame)
      }
    }
  }, [node])

  return (
    <Flex
      ref={ref}
      row
      alignItems="center"
      className="scrollbar-hidden"
      style={SCROLL_PADDING_STYLE}
      $platform-web={{ overflowX: 'auto', overscrollBehaviorX: 'none', ...edgeFadeMaskStyle(edgeFades) }}
      {...flexProps}
    >
      {children}
    </Flex>
  )
}

/** `scrollIntoView({ inline: 'nearest' })` against the scroll padding, as a target `scrollLeft`. */
function getNearestScrollLeft(scroller: HTMLElement, item: Element): number {
  const scrollerRect = scroller.getBoundingClientRect()
  const itemRect = item.getBoundingClientRect()
  const overflowLeft = itemRect.left - (scrollerRect.left + SCROLL_PADDING_PX)
  const overflowRight = itemRect.right - (scrollerRect.right - SCROLL_PADDING_PX)
  // An item wider than the padded viewport aligns its start, like native `nearest`.
  const delta = overflowLeft < 0 ? overflowLeft : overflowRight > 0 ? Math.min(overflowRight, overflowLeft) : 0
  const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth
  return Math.max(0, Math.min(scroller.scrollLeft + delta, maxScrollLeft))
}

function easeOutCubic(progress: number): number {
  return 1 - (1 - progress) ** 3
}

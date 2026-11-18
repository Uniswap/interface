import { BREAKPOINT_PX } from '@universe/mycelium/theme-hooks-compat'
import { useLayoutEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import {
  CAROUSEL_CARD_GAP,
  CAROUSEL_FADE_WIDTH,
  CAROUSEL_FADE_WIDTH_SMALL,
  CAROUSEL_SMALL_CARD_MAX_WIDTH,
} from '~/components/TokenCardCarousel/constants'

function getCardsPerView(containerWidth: number): number {
  if (containerWidth <= BREAKPOINT_PX.sm) {
    return 1
  }
  if (containerWidth <= BREAKPOINT_PX.md) {
    return 2
  }
  if (containerWidth <= BREAKPOINT_PX.xl) {
    return 3
  }
  return 4
}

function getCardWidth(containerWidth: number): number {
  if (containerWidth <= BREAKPOINT_PX.sm) {
    return Math.min(containerWidth * 0.8, CAROUSEL_SMALL_CARD_MAX_WIDTH)
  }

  const cardsPerView = getCardsPerView(containerWidth)
  return (containerWidth - (cardsPerView - 1) * CAROUSEL_CARD_GAP) / cardsPerView
}

export function useCarouselLayout(containerRef: React.RefObject<HTMLElement | null>): {
  /** Measured container width; 0 until the first measurement. */
  containerWidth: number
  cardWidth: number
  fadeWidth: number
  showArrowButtons: boolean
} {
  const [containerWidth, setContainerWidth] = useState(0)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) {
      return undefined
    }

    const measure = (): void => setContainerWidth(el.clientWidth)
    // Window resizes commit synchronously before the frame's layout, so cards never paint a frame at the old width.
    // Not from the ResizeObserver: a sync render during its delivery can resize observed ancestors (RO loop error).
    const measureBeforePaint = (): void => flushSync(measure)

    measure()
    window.addEventListener('resize', measureBeforePaint)
    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(el)

    return () => {
      window.removeEventListener('resize', measureBeforePaint)
      resizeObserver.disconnect()
    }
  }, [containerRef])

  const isSmallViewport = containerWidth > 0 && containerWidth <= BREAKPOINT_PX.sm

  return {
    containerWidth,
    cardWidth: containerWidth > 0 ? getCardWidth(containerWidth) : CAROUSEL_SMALL_CARD_MAX_WIDTH,
    fadeWidth: isSmallViewport ? CAROUSEL_FADE_WIDTH_SMALL : CAROUSEL_FADE_WIDTH,
    showArrowButtons: containerWidth === 0 || containerWidth > BREAKPOINT_PX.sm,
  }
}

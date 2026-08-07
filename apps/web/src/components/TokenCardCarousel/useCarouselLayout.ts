import { useEffect, useState } from 'react'
import { breakpoints } from 'ui/src/theme'
import {
  CAROUSEL_CARD_GAP,
  CAROUSEL_FADE_WIDTH,
  CAROUSEL_FADE_WIDTH_SMALL,
  CAROUSEL_SMALL_CARD_MAX_WIDTH,
} from '~/components/TokenCardCarousel/constants'

function getCardsPerView(containerWidth: number): number {
  if (containerWidth <= breakpoints.sm) {
    return 1
  }
  if (containerWidth <= breakpoints.md) {
    return 2
  }
  if (containerWidth <= breakpoints.xl) {
    return 3
  }
  return 4
}

function getCardWidth(containerWidth: number): number {
  if (containerWidth <= breakpoints.sm) {
    return Math.min(containerWidth * 0.8, CAROUSEL_SMALL_CARD_MAX_WIDTH)
  }

  const cardsPerView = getCardsPerView(containerWidth)
  return (containerWidth - (cardsPerView - 1) * CAROUSEL_CARD_GAP) / cardsPerView
}

export function useCarouselLayout(containerRef: React.RefObject<HTMLElement | null>): {
  cardWidth: number
  fadeWidth: number
  showArrowButtons: boolean
} {
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) {
      return undefined
    }

    const updateWidth = (): void => {
      setContainerWidth(el.clientWidth)
    }

    updateWidth()

    const resizeObserver = new ResizeObserver(updateWidth)
    resizeObserver.observe(el)

    return () => {
      resizeObserver.disconnect()
    }
  }, [containerRef])

  const isSmallViewport = containerWidth > 0 && containerWidth <= breakpoints.sm

  return {
    cardWidth: containerWidth > 0 ? getCardWidth(containerWidth) : CAROUSEL_SMALL_CARD_MAX_WIDTH,
    fadeWidth: isSmallViewport ? CAROUSEL_FADE_WIDTH_SMALL : CAROUSEL_FADE_WIDTH,
    showArrowButtons: containerWidth === 0 || containerWidth > breakpoints.sm,
  }
}

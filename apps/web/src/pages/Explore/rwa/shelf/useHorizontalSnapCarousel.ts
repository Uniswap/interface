import { useCallback, useEffect, useRef, useState } from 'react'
import { useEvent } from 'utilities/src/react/hooks'
import { ASSET_SHELF_CARD_GAP } from '~/pages/Explore/rwa/shelf/assetCardConstants'
import {
  getCarouselPageSize,
  getPageScrollTarget,
  getSnapPositionsFromScroller,
  SCROLL_EDGE_TOLERANCE_PX,
} from '~/pages/Explore/rwa/shelf/carouselSnapScroll'

const HOVER_HIDE_DELAY_MS = 100

export function useHorizontalSnapCarousel({
  cardWidth,
  itemCount,
  isLoading,
}: {
  cardWidth: number
  itemCount: number
  isLoading: boolean
}): {
  setScrollRef: (node: HTMLDivElement | null) => void
  isAtEnd: boolean
  isAtStart: boolean
  isScrollSettled: boolean
  isHovered: boolean
  showButton: () => void
  hideButton: () => void
  onNext: () => void
  onPrev: () => void
} {
  const scrollRef = useRef<HTMLDivElement>(null)
  const setScrollRef = useCallback((node: HTMLDivElement | null) => {
    scrollRef.current = node
  }, [])
  const targetScrollLeftRef = useRef<number | null>(null)
  const hideButtonTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isAtEnd, setIsAtEnd] = useState(false)
  const [isAtStart, setIsAtStart] = useState(true)
  const [isScrollSettled, setIsScrollSettled] = useState(true)
  const [isHovered, setIsHovered] = useState(false)

  const updateMetrics = useEvent((): void => {
    const el = scrollRef.current
    if (!el) {
      return
    }

    const distanceFromEnd = el.scrollWidth - el.clientWidth - el.scrollLeft
    setIsAtEnd(distanceFromEnd <= SCROLL_EDGE_TOLERANCE_PX)
    setIsAtStart(el.scrollLeft <= SCROLL_EDGE_TOLERANCE_PX)

    if (
      targetScrollLeftRef.current !== null &&
      Math.abs(el.scrollLeft - targetScrollLeftRef.current) <= SCROLL_EDGE_TOLERANCE_PX
    ) {
      targetScrollLeftRef.current = null
    }
  })

  useEffect(() => {
    const el = scrollRef.current
    if (!el || isLoading) {
      return undefined
    }

    updateMetrics()

    let settleFallbackTimer: ReturnType<typeof setTimeout> | undefined
    const supportsScrollEnd = 'onscrollend' in el

    const markUnsettled = (): void => {
      setIsScrollSettled(false)
      updateMetrics()
    }

    const markSettled = (): void => {
      setIsScrollSettled(true)
      updateMetrics()
    }

    const onScroll = (): void => {
      markUnsettled()
      if (!supportsScrollEnd) {
        if (settleFallbackTimer) {
          clearTimeout(settleFallbackTimer)
        }
        settleFallbackTimer = setTimeout(markSettled, 500)
      }
    }

    const onScrollEnd = (): void => {
      if (settleFallbackTimer) {
        clearTimeout(settleFallbackTimer)
      }
      markSettled()
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    if (supportsScrollEnd) {
      el.addEventListener('scrollend', onScrollEnd, { passive: true })
    }

    const resizeObserver = new ResizeObserver(() => {
      updateMetrics()
    })
    resizeObserver.observe(el)

    return () => {
      resizeObserver.disconnect()
      el.removeEventListener('scroll', onScroll)
      if (supportsScrollEnd) {
        el.removeEventListener('scrollend', onScrollEnd)
      }
      if (settleFallbackTimer) {
        clearTimeout(settleFallbackTimer)
      }
    }
  }, [updateMetrics, itemCount, isLoading, cardWidth])

  const clearHideTimer = useEvent((): void => {
    if (hideButtonTimerRef.current) {
      clearTimeout(hideButtonTimerRef.current)
      hideButtonTimerRef.current = null
    }
  })

  useEffect(() => clearHideTimer, [clearHideTimer])

  const showButton = useEvent((): void => {
    clearHideTimer()
    setIsHovered(true)
  })

  const hideButton = useEvent((): void => {
    clearHideTimer()
    hideButtonTimerRef.current = setTimeout(() => {
      hideButtonTimerRef.current = null
      setIsHovered(false)
    }, HOVER_HIDE_DELAY_MS)
  })

  const scrollByPage = useEvent((direction: 'next' | 'prev'): void => {
    const el = scrollRef.current
    if (!el) {
      return
    }

    const positions = getSnapPositionsFromScroller(el)
    if (positions.length === 0) {
      return
    }

    const firstCard = el.firstElementChild as HTMLElement | null
    const measuredCardWidth = firstCard?.offsetWidth ?? cardWidth
    const cardStep = measuredCardWidth + ASSET_SHELF_CARD_GAP
    const pageSize = getCarouselPageSize(el.clientWidth, cardStep)
    const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth)
    const currentScrollLeft = targetScrollLeftRef.current ?? el.scrollLeft
    const targetScrollLeft = getPageScrollTarget({
      positions,
      scrollLeft: currentScrollLeft,
      direction,
      pageSize,
      maxScrollLeft,
    })

    if (Math.abs(targetScrollLeft - currentScrollLeft) <= SCROLL_EDGE_TOLERANCE_PX) {
      return
    }

    targetScrollLeftRef.current = targetScrollLeft
    setIsScrollSettled(false)
    el.scrollTo({ left: targetScrollLeft, behavior: 'smooth' })
    setTimeout(updateMetrics, 0)
  })

  const onNext = useEvent((): void => {
    scrollByPage('next')
  })

  const onPrev = useEvent((): void => {
    scrollByPage('prev')
  })

  return {
    setScrollRef,
    isAtEnd,
    isAtStart,
    isScrollSettled,
    isHovered,
    showButton,
    hideButton,
    onNext,
    onPrev,
  }
}

import styled from 'lib/styled-components'
import { ChevronLeftIcon, ChevronRightIcon } from 'nft/components/icons'
import { calculateCardIndex, calculateFirstCardIndex } from 'nft/utils'
import { ReactNode, useCallback, useEffect, useRef } from 'react'

const CarouselContainer = styled.div`
  display: flex;
  width: 100%;
  justify-content: flex-end;
`

const CarouselCardContainer = styled.div`
  position: relative;
  width: 100%;
  overflow-x: hidden;
  max-width: 100%;
  height: 390px;

  @media only screen and (min-width: ${({ theme }) => `${theme.breakpoint.lg}px`}) {
    max-width: 600px;
  }
`

const CarouselItemCard = styled.div`
  display: flex;
  justify-content: center;
  padding: 4px 12px 32px;
  position: absolute;
  transition: transform 0.5s ease-in-out;
  width: calc(100%);
  height: calc(100%);

  @media screen and (min-width: ${({ theme }) => theme.breakpoint.lg}px) {
    padding: 4px 32px 32px;
  }
`

const CarouselItemIcon = styled.div`
  align-items: center;
  color: ${({ theme }) => theme.neutral1};
  cursor: pointer;
  display: none;
  user-select: none;
  height: calc(100%);
  padding: 4px 0 32px;

  @media only screen and (min-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    display: flex;
  }

  :hover {
    opacity: ${({ theme }) => theme.opacity.hover};
  }
`

interface CarouselProps {
  children: ReactNode[]
  activeIndex: number
  toggleNextSlide: (idx: number) => void
}

const MAX_CARD_WIDTH = 800

export const Carousel = ({ children, activeIndex, toggleNextSlide }: CarouselProps) => {
  const idx = useCallback((x: number, l = children.length) => calculateCardIndex(x, l), [children])
  const getPos = useCallback(
    (i: number, firstVis: number, firstVisIdx: number) => calculateFirstCardIndex(i, firstVis, firstVisIdx, idx),
    [idx],
  )
  const containerRef = useRef<HTMLDivElement>(null)

  const updatePositions = useCallback(
    (index: number) => {
      const cards = containerRef.current?.children
      if (!cards) {
        return
      }

      Array.from(cards).forEach((card, i) => {
        const position = getPos(i, index, 0)
        const offset = (position - index) * MAX_CARD_WIDTH
        ;(card as HTMLElement).style.transform = `translateX(${offset}px)`
      })
    },
    [getPos],
  )

  useEffect(() => {
    updatePositions(activeIndex)
  }, [activeIndex, updatePositions])

  const direction = useRef(0)

  const toggleSlide = useCallback(
    (next: -1 | 1) => {
      direction.current = next
      toggleNextSlide(next)
    },
    [toggleNextSlide],
  )

  useEffect(() => {
    const interval = setInterval(() => {
      toggleSlide(1)
    }, 7_000)
    return () => {
      clearInterval(interval)
    }
  }, [toggleSlide, activeIndex])

  return (
    <CarouselContainer>
      <CarouselItemIcon onClick={() => toggleSlide(-1)}>
        <ChevronLeftIcon width="16px" height="16px" />
      </CarouselItemIcon>
      <CarouselCardContainer ref={containerRef}>
        {children.map((child, i) => (
          <CarouselItemCard key={i}>{child}</CarouselItemCard>
        ))}
      </CarouselCardContainer>
      <CarouselItemIcon onClick={() => toggleSlide(1)}>
        <ChevronRightIcon width="16px" height="16px" />
      </CarouselItemIcon>
    </CarouselContainer>
  )
}

export const LoadingCarousel = ({ children }: { children: ReactNode }) => (
  <Carousel activeIndex={0} toggleNextSlide={() => undefined}>
    {[children]}
  </Carousel>
)

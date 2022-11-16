import { useWindowSize } from 'hooks/useWindowSize'
import { ChevronLeftIcon, ChevronRightIcon } from 'nft/components/icons'
import { calculateCardIndex, calculateFirstCardIndex, calculateRank } from 'nft/utils'
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { a, useSprings } from 'react-spring'
import styled, { css } from 'styled-components/macro'

const MAX_CARD_WIDTH = 595

const baseCarouselItemStyle = css`
  height: 315px;
  padding-top: 3px;
  padding-bottom: 32px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    height: 296px;
  }
`

const CarouselContainer = styled.div`
  display: flex;
  box-sizing: border-box;
  max-width: ${MAX_CARD_WIDTH}px;
  width: 100%;
`

const CarouselCardContainer = styled.div`
  position: relative;
  width: 100%;
  overflow-x: hidden;
`

const CarouselCard = styled(a.div)`
  ${baseCarouselItemStyle};

  display: flex;
  justify-content: center;
  padding: 3px 32px 32px 32px;

  position: absolute;
  will-change: transform;
`

const IconContainer = styled.div`
  ${baseCarouselItemStyle}

  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;

  color: ${({ theme }) => theme.textPrimary};

  :hover {
    opacity: ${({ theme }) => theme.opacity.hover};
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    display: none;
  }
`

interface CarouselProps {
  children: ReactNode[]
  activeIndex: number
  toggleNextSlide: (idx: number) => void
}

const FIRST_CARD_OFFSET = 0

export const Carousel = ({ children, activeIndex, toggleNextSlide }: CarouselProps) => {
  const { width } = useWindowSize()
  const carouselCardContainerRef = useRef<HTMLDivElement>(null)
  const [cardWidth, setCardWidth] = useState(MAX_CARD_WIDTH)

  useEffect(() => {
    if (carouselCardContainerRef.current) {
      setCardWidth(Math.min(carouselCardContainerRef.current.offsetWidth, MAX_CARD_WIDTH))
    }
  }, [width])

  const idx = useCallback((x: number, l = children.length) => calculateCardIndex(x, l), [children])
  const getPos = useCallback(
    (i: number, firstVis: number, firstVisIdx: number) => calculateFirstCardIndex(i, firstVis, firstVisIdx, idx),
    [idx]
  )
  const [springs, set] = useSprings(children.length, (i) => ({
    x: (i < children.length - 1 ? i : -1) * cardWidth + FIRST_CARD_OFFSET,
  }))
  const prev = useRef([0, 1])

  const runSprings = useCallback(
    (y: number, vy: number) => {
      const firstVis = idx(Math.floor(y / cardWidth) % children.length)
      const firstVisIdx = vy < 0 ? children.length - 2 : 1
      set((i) => {
        const position = getPos(i, firstVis, firstVisIdx)
        const prevPosition = getPos(i, prev.current[0], prev.current[1])
        const rank = calculateRank(firstVis, firstVisIdx, position, children.length, y)
        return {
          x: (-y % (cardWidth * children.length)) + cardWidth * rank + FIRST_CARD_OFFSET,
          immediate: vy < 0 ? prevPosition > position : prevPosition < position,
          config: { tension: 250, friction: 30 },
        }
      })
      prev.current = [firstVis, firstVisIdx]
    },
    [idx, getPos, set, cardWidth, children.length]
  )

  const direction = useRef(0)

  useEffect(() => {
    runSprings(activeIndex * cardWidth, direction.current)
  }, [activeIndex, cardWidth, runSprings])

  const toggleSlide = useCallback(
    (next: -1 | 1) => {
      direction.current = next
      toggleNextSlide(next)
    },
    [toggleNextSlide]
  )

  useEffect(() => {
    const interval = setInterval(async () => {
      toggleSlide(1)
    }, 7_000)
    return () => {
      clearInterval(interval)
    }
  }, [toggleSlide, activeIndex])

  return (
    <CarouselContainer>
      <IconContainer onClick={() => toggleSlide(-1)}>
        <ChevronLeftIcon width="16px" height="16px" />
      </IconContainer>
      <CarouselCardContainer ref={carouselCardContainerRef}>
        {springs.map(({ x }, i) => (
          <CarouselCard
            key={i}
            style={{
              width: cardWidth,
              x,
            }}
          >
            {children[i]}
          </CarouselCard>
        ))}
      </CarouselCardContainer>
      <IconContainer onClick={() => toggleSlide(1)}>
        <ChevronRightIcon width="16px" height="16px" />
      </IconContainer>
    </CarouselContainer>
  )
}

export const LoadingCarousel = ({ children }: { children: ReactNode }) => (
  <Carousel activeIndex={0} toggleNextSlide={() => undefined}>
    {[children]}
  </Carousel>
)

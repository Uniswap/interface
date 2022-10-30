import { useWindowSize } from 'hooks/useWindowSize'
import { ChevronLeftIcon } from 'nft/components/icons'
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { a, useSprings } from 'react-spring'
import styled from 'styled-components/macro'

const CarouselContainer = styled.div`
  max-width: 592px;
  position: relative;
  width: 100%;
  overflow-x: hidden;
`

const CarouselCard = styled(a.div)`
  position: absolute;
  padding-left: 8px;
  padding-right: 8px;
  display: flex;
  top: 3px;
  height: 280px;
  will-change: transform;
  justify-content: center;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    height: 296px;
  }
`

const CarouselOverlay = styled.div<{ right?: boolean }>`
  position: absolute;
  display: flex;
  top: 3px;
  ${({ right }) => (right ? 'right: 0px' : 'left: 0px')};
  width: 40px;
  height: 280px;
  background: linear-gradient(
    ${({ right }) => (right ? 'to left' : 'to right')},
    ${({ theme }) => theme.backgroundModule} 0%,
    rgba(0, 0, 0, 0) 100%
  );
  align-items: center;
  justify-content: ${({ right }) => (right ? 'start' : 'end')};
  z-index: 1;
  cursor: pointer;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    height: 296px;
  }
`

const IconContainer = styled.div<{ right?: boolean }>`
  display: flex;
  height: 100%;
  justify-content: center;
  align-items: center;
  padding: 8px;
  ${({ right }) => (right ? 'transform: rotate(180deg)' : undefined)};
  color: ${({ theme }) => theme.textPrimary};
  :hover {
    opacity: ${({ theme }) => theme.opacity.hover};
  }
`

interface CarouselProps {
  children: ReactNode[]
}

const FIRST_CARD_OFFSET = 40
const MAX_CARD_WIDTH = 480

export const Carousel = ({ children }: CarouselProps) => {
  const { width } = useWindowSize()
  const carouselContainerRef = useRef<HTMLDivElement>(null)
  const [cardWidth, setCardWidth] = useState(MAX_CARD_WIDTH)

  useEffect(() => {
    if (carouselContainerRef.current) {
      setCardWidth(Math.min(carouselContainerRef.current.offsetWidth - 80 - 32, MAX_CARD_WIDTH))
    }
  }, [width])

  const idx = useCallback((x: number, l = children.length) => (x < 0 ? x + l : x) % l, [children])
  const getPos = useCallback(
    (i: number, firstVis: number, firstVisIdx: number) => idx(i - firstVis + firstVisIdx),
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
        const rank =
          firstVis -
          (y < 0 ? children.length : 0) +
          position -
          firstVisIdx +
          (y < 0 && firstVis === 0 ? children.length : 0)
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

  useEffect(() => {
    runSprings(index.current, 0)
  }, [runSprings])

  const index = useRef(0)

  const toggleSlide = (next: -1 | 1) => {
    const offset = cardWidth * next
    index.current += offset

    runSprings(index.current, next)
  }

  return (
    <CarouselContainer ref={carouselContainerRef}>
      <CarouselOverlay onClick={() => toggleSlide(-1)}>
        <IconContainer>
          <ChevronLeftIcon width="16px" height="16px" />
        </IconContainer>
      </CarouselOverlay>
      <CarouselOverlay right onClick={() => toggleSlide(1)}>
        <IconContainer right>
          <ChevronLeftIcon width="16px" height="16px" />
        </IconContainer>
      </CarouselOverlay>
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
    </CarouselContainer>
  )
}

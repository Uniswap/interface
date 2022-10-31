import { useWindowSize } from 'hooks/useWindowSize'
import { ChevronLeftIcon } from 'nft/components/icons'
import { calculateCardIndex, calculateFirstCardIndex, calculateRank } from 'nft/utils'
import { ReactNode, useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { a, useSprings } from 'react-spring'
import styled from 'styled-components/macro'

const CarouselContainer = styled.div`
  display: flex;
  max-width: 592px;
  width: 100%;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    height: 320px;
  }
`

const CarouselCardContainer = styled.div`
  max-width: 512px;
  position: relative;
  width: 100%;
  overflow-x: hidden;
`

const CarouselCard = styled(a.div)`
  position: absolute;
  padding-left: 16px;
  padding-right: 16px;
  display: flex;
  top: 3px;
  height: 280px;
  will-change: transform;
  justify-content: center;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    height: 296px;
  }
`

const IconContainer = styled.div<{ right?: boolean }>`
  display: flex;
  height: 280px;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  ${({ right }) => (right ? 'transform: rotate(180deg)' : undefined)};
  color: ${({ theme }) => theme.textPrimary};

  :hover {
    opacity: ${({ theme }) => theme.opacity.hover};
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    height: 296px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    display: none;
  }
`

interface CarouselProps {
  children: ReactNode[]
}

const FIRST_CARD_OFFSET = 0
const MAX_CARD_WIDTH = 512

export const Carousel = ({ children }: CarouselProps) => {
  const { width } = useWindowSize()
  const carouselCardContainerRef = useRef<HTMLDivElement>(null)
  const [cardWidth, setCardWidth] = useState(MAX_CARD_WIDTH)
  const [resetTimer, toggleResetTimer] = useReducer((state) => !state, false)

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

  useEffect(() => {
    runSprings(index.current, 0)
  }, [runSprings])

  const index = useRef(0)

  const toggleSlide = useCallback(
    (next: -1 | 1) => {
      const offset = cardWidth * next
      index.current += offset

      runSprings(index.current, next)
      toggleResetTimer()
    },
    [runSprings, cardWidth]
  )

  useEffect(() => {
    const interval = setInterval(async () => {
      toggleSlide(1)
    }, 7_000)
    return () => {
      clearInterval(interval)
    }
  }, [toggleSlide, resetTimer])

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
      <IconContainer right onClick={() => toggleSlide(1)}>
        <ChevronLeftIcon width="16px" height="16px" />
      </IconContainer>
    </CarouselContainer>
  )
}

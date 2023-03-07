import { ChevronLeftIcon, ChevronRightIcon } from 'nft/components/icons'
import { calculateCardIndex, calculateFirstCardIndex, calculateRank } from 'nft/utils'
import { ReactNode, useCallback, useEffect, useRef } from 'react'
import { a, useSprings } from 'react-spring'
import styled from 'styled-components/macro'

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

  @media only screen and (min-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    max-width: 600px;
  }
`

const CarouselItemCard = styled(a.div)`
  display: flex;
  justify-content: center;
  padding: 4px 12px 32px;
  position: absolute;
  will-change: transform;
  width: calc(100%);
  height: calc(100%);

  @media screen and (min-width: ${({ theme }) => theme.breakpoint.md}px) {
    padding: 4px 32px 32px;
  }
`

const CarouselItemIcon = styled.div`
  align-items: center;
  color: ${({ theme }) => theme.textPrimary};
  cursor: pointer;
  display: none;
  user-select: none;
  height: calc(100%);
  padding: 4px 0 32px;

  @media only screen and (min-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
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
    [idx]
  )
  const [springs, set] = useSprings(children.length, (i) => ({
    x: (i < children.length - 1 ? i : -1) * MAX_CARD_WIDTH,
  }))
  const prev = useRef([0, 1])

  const runSprings = useCallback(
    (y: number, vy: number) => {
      const firstVis = idx(Math.floor(y / MAX_CARD_WIDTH) % children.length)
      const firstVisIdx = vy < 0 ? children.length - 2 : 1
      set((i) => {
        const position = getPos(i, firstVis, firstVisIdx)
        const prevPosition = getPos(i, prev.current[0], prev.current[1])
        const rank = calculateRank(firstVis, firstVisIdx, position, children.length, y)
        return {
          x: (-y % (MAX_CARD_WIDTH * children.length)) + MAX_CARD_WIDTH * rank,
          immediate: vy < 0 ? prevPosition > position : prevPosition < position,
          config: { tension: 250, friction: 30 },
        }
      })
      prev.current = [firstVis, firstVisIdx]
    },
    [idx, getPos, set, children.length]
  )

  const direction = useRef(0)

  useEffect(() => {
    runSprings(activeIndex * MAX_CARD_WIDTH, direction.current)
  }, [activeIndex, runSprings])

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
      <CarouselItemIcon onClick={() => toggleSlide(-1)}>
        <ChevronLeftIcon width="16px" height="16px" />
      </CarouselItemIcon>
      <CarouselCardContainer>
        {springs.map(({ x }, i) => (
          <CarouselItemCard key={i} style={{ x }}>
            {children[i]}
          </CarouselItemCard>
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

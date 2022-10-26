import { ChevronLeftIcon } from 'nft/components/icons'
import { ReactNode, useCallback, useRef } from 'react'
import { a, useSprings } from 'react-spring'
import styled from 'styled-components/macro'

const CarouselContainer = styled.div`
  position: relative;
  width: 100%;
  overflow-x: hidden;
`

const CarouselCard = styled(a.div)`
  position: absolute;
  display: flex;
  top: 3px;
  height: 280px;
  will-change: transform;
  justify-content: center;
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
  width?: number
  carouselWidth?: number
}

export const Carousel = ({ children, width = 472, carouselWidth = 664 }: CarouselProps) => {
  const idx = useCallback((x: number, l = children.length) => (x < 0 ? x + l : x) % l, [children])
  const getPos = useCallback(
    (i: number, firstVis: number, firstVisIdx: number) => idx(i - firstVis + firstVisIdx),
    [idx]
  )
  const [springs, set] = useSprings(children.length, (i) => ({
    x: (i < children.length - 1 ? i : -1) * width + (carouselWidth - width) / 2,
  }))
  const prev = useRef([0, 1])

  const runSprings = useCallback(
    (y: number, vy: number) => {
      const firstVis = idx(Math.floor(y / width) % children.length)
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
          x: (-y % (width * children.length)) + width * rank + (carouselWidth - width) / 2,
          immediate: vy < 0 ? prevPosition > position : prevPosition < position,
          config: { tension: 250, friction: 30 },
        }
      })
      prev.current = [firstVis, firstVisIdx]
    },
    [idx, getPos, width, carouselWidth, set, children.length]
  )

  const index = useRef(0)

  const toggleSlide = (next: -1 | 1) => {
    const offset = width * next
    index.current += offset

    runSprings(index.current, next)
  }

  return (
    <CarouselContainer>
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
        <CarouselCard key={i} style={{ width, x }}>
          {children[i]}
        </CarouselCard>
      ))}
    </CarouselContainer>
  )
}

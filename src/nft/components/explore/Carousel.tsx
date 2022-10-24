import { ReactNode, useCallback, useRef } from 'react'
import { a, useSprings } from 'react-spring'
import styled from 'styled-components/macro'

const CarouselContainer = styled.div`
  position: relative;
  height: full;
  width: 100%;
  overflow-x: hidden;
`

const CarouselCard = styled(a.div)`
  position: absolute;
  display: flex;
  height: 100%;
  will-change: transform;
  justify-content: center;
`

interface CarouselProps {
  children: ReactNode[]
  width?: number
  carouselWidth?: number
}

export const Carousel = ({ children, width = 488, carouselWidth = 568 }: CarouselProps) => {
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
      {springs.map(({ x }, i) => (
        <CarouselCard key={i} style={{ width, x }} onClick={() => toggleSlide(-1)}>
          {children[i]}
        </CarouselCard>
      ))}
    </CarouselContainer>
  )
}

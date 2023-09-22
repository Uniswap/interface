import styled from 'styled-components'

import { FadeIn, Rotate } from './Animate'
import { Box } from './Generics'

type Point = {
  x: number
  y: number
}

function equidistantPointsOnCircle(n: number, r: number): Point[] {
  const points = []
  for (let i = 0; i < n; i++) {
    const theta = (i * 2 * Math.PI) / n
    points.push({
      x: r * Math.cos(theta),
      y: r * Math.sin(theta),
    })
  }
  return points
}

function range(n: number): number[] {
  const arr = []
  for (let i = 0; i < n; i++) {
    arr.push(i)
  }
  return arr
}

export function RingHero() {
  const w = window.innerWidth
  const r1 = w * 0.4 * 0.5
  const r2 = w * 0.6 * 0.5
  const r3 = w * 0.9 * 0.5
  const r4 = w * 1.0 * 0.5
  const size = 96
  return (
    <Container>
      <RingBox>
        <Rotate duration={80}>
          <FadeIn delay={1.8}>
            <Box width={`${r3 * 2}px`}>
              {equidistantPointsOnCircle(16, r3).map((i) => {
                const x = i.x + r3 - size / 2
                const y = i.y - size / 2
                return (
                  <TokenIcon
                    depth={0.25}
                    size={size}
                    key={`tki-${i}`}
                    style={{ transform: `translate(${x}px, ${y}px)` }}
                  />
                )
              })}
            </Box>
          </FadeIn>
        </Rotate>
      </RingBox>

      <RingBox>
        <Rotate duration={60} reverse>
          <FadeIn delay={1.8}>
            <Box width={`${r2 * 2}px`}>
              {equidistantPointsOnCircle(12, r2).map((i) => {
                const x = i.x + r2 - size / 2
                const y = i.y - size / 2
                return (
                  <TokenIcon
                    depth={0.5}
                    size={size}
                    key={`tki-${i}`}
                    style={{ transform: `translate(${x}px, ${y}px)` }}
                  />
                )
              })}
            </Box>
          </FadeIn>
        </Rotate>
      </RingBox>
      <TopGradient />
      <BottomGradient />
    </Container>
  )
}

const Container = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  overflow: hidden;
`

type TokenIconProps = {
  size: number
  depth: number
}

const TokenIcon = styled.div<TokenIconProps>`
  position: absolute;
  border-radius: 50%;
  width: ${(props) => `${props.size}px`};
  height: ${(props) => `${props.size}px`};
  background-color: #315ED5;
  filter: blur(${(props) => props.depth * 10}px);});
`

const RingBox = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`

const TopGradient = styled.div`
  position: absolute;
  top: 0;
  width: 100%;
  height: 200px;
  background: linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0) 100%);
`

const BottomGradient = styled.div`
  position: absolute;
  width: 100%;
  height: 200px;
  bottom: 0;
  background: linear-gradient(0deg, #ffffff 0%, rgba(255, 255, 255, 0) 100%);
`

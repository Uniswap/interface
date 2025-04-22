import { approvedERC20, approvedERC721, InteractiveToken } from 'pages/Landing/assets/approvedTokens'
import { Token } from 'pages/Landing/components/TokenCloud/Token'
import { mixArrays, randomFloat, randomInt } from 'pages/Landing/components/TokenCloud/utils'
import PoissonDiskSampling from 'poisson-disk-sampling'
import { useMemo, useRef } from 'react'
import { Flex } from 'ui/src'

export type TickerPosition = 'left' | 'right'

export type TokenPoint = InteractiveToken & {
  x: number
  y: number
  blur: number
  size: number
  color: string
  logoUrl: string
  opacity: number
  rotation: number
  delay: number
  floatDuration: number
  ticker: string
  tickerPosition: TickerPosition
}

export function TokenCloud({ transition }: { transition?: boolean }) {
  const pts = useMemo(() => {
    const tokenList: InteractiveToken[] = mixArrays(approvedERC20, approvedERC721, 0.33)

    const w = window.innerWidth
    const h = window.innerHeight - 72
    const leftThreshold = w / 2 - 240
    const rightThreshold = w / 2 + 240
    const poissonConfig = {
      shape: [w, h],
      minDistance: 250,
      maxDistance: 375,
      tries: 10,
    }
    const poissonDiskSampling = new PoissonDiskSampling(poissonConfig)
    const points = poissonDiskSampling
      .fill()
      // Order by distance from center, ie idx = 0 is closest to center
      .sort((a, b) => Math.abs(a[0] - w / 2) - Math.abs(b[0] - w / 2))
      .map(([x, y], idx: number) => {
        const token: InteractiveToken = tokenList[idx % tokenList.length]
        const size = randomInt(50, 96)
        return {
          x,
          y,
          blur: (1 / size) * 500 * ((x > leftThreshold && x < rightThreshold) || y < 100 ? 5 : 1), // make blur bigger for smaller icons
          size,
          color: token.color,
          logoUrl: token.logoUrl,
          opacity: randomFloat(0.5, 1.0) * ((x > leftThreshold && x < rightThreshold) || y < 100 ? 0.75 : 1),
          rotation: randomInt(-20, 20),
          delay: Math.abs(x - w / 2) / 800,
          floatDuration: randomFloat(3, 6),
          ticker: token.symbol,
          tickerPosition: (x < leftThreshold && x + 100 > leftThreshold) || x + 200 > w ? 'left' : 'right',
          standard: token.standard,
          address: token.address,
          chain: token.chain,
        }
      })
      .map((p) => {
        return {
          ...p,
          y: p.y - 0.5 * p.size,
          x: p.x - 0.5 * p.size,
        }
      })

    return points as TokenPoint[]
  }, [])

  const constraintsRef = useRef(null)

  return (
    <Flex
      ref={constraintsRef}
      width="100vw"
      position="absolute"
      centered
      overflow="hidden"
      inset={0}
      pointerEvents="none"
      contain="strict"
    >
      {pts.map((point: TokenPoint, idx) => {
        return <Token key={`token-${idx}`} point={point} idx={idx} transition={transition} />
      })}
    </Flex>
  )
}

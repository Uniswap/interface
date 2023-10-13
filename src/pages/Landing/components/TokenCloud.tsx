import { motion } from 'framer-motion'
import { HistoryDuration } from 'graphql/data/__generated__/types-and-hooks'
import { useLandingTokens } from 'graphql/data/LandingTokens'
import { useTrendingCollections } from 'graphql/data/nft/TrendingCollections'
// @ts-ignore
import PoissonDiskSampling from 'poisson-disk-sampling'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { defaultCoin, staticCoins, staticCollections } from '../staticTokens'
import { Box } from './Generics'
import { PriceArrowDown, PriceArrowUp, PriceNeutral } from './Icons'

const tokenList = mixArrays(staticCoins, staticCollections, 0.33)

type Token = {
  address: string
  color: string
  logoUrl: string
  pricePercentChange: number
  symbol: string
  type: string
}

type TokenPoint = {
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
  delta: number
  type: string
  address: string
}

type Point = [number, number]

type SimpleToken = {
  delta: number
  logoUrl: string
  ticker: string
  type: string
  color: string
}

function isNegative(n: number) {
  return n < 0
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function randomChoice<T>(choices: T[]): T {
  return choices[Math.floor(Math.random() * choices.length)]
}

function randomHSLColor(): string {
  return `hsl(${Math.floor(Math.random() * 360)}, 80%, 50%)`
}

function isInBounds(x: number, y: number, x1: number, y1: number, x2: number, y2: number) {
  return x >= x1 && x <= x2 && y >= y1 && y <= y2
}

function shuffleArray(array: any[]) {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

function mixArrays(arr1: any[], arr2: any[], ratio: number) {
  const arr2TrimLength = Math.floor(arr1.length * ratio)
  const arr2Trimmed = arr2.slice(0, arr2TrimLength)

  return shuffleArray([...arr1, ...arr2Trimmed])
}

const w = 3000
const h = 800 - 72

const centerRect = {
  x: w / 2 - 250,
  y: 0,
  w: w / 2 + 250,
  h,
}

const poissonConfig = {
  shape: [w, h],
  minDistance: 225,
  maxDistance: 350,
  tries: 10,
}

export function TokenCloud() {
  const [pts, setPts] = useState<TokenPoint[]>([])
  const tokens = useLandingTokens(1)
  const collections = useTrendingCollections(25, HistoryDuration.Day)
  const [displayTokens, setDisplayTokens] = useState<SimpleToken[]>([])

  useEffect(() => {
    if (!collections.data || !tokens.data) return
    const simpleCollectionData = collections?.data?.map((c) => {
      return {
        delta: c.floorChange?.toFixed(2) || 0,
        logoUrl: c.imageUrl || '',
        ticker: c.name || '',
        type: 'collection',
        color: randomHSLColor(),
      }
    })

    console.log('simpleCollectionData', simpleCollectionData)

    const simpleTokenData = tokens?.data?.map((t) => {
      return {
        // @ts-ignore
        delta: t.market?.pricePercentChange?.value?.toFixed(2) || 0,
        // @ts-ignore
        logoUrl: t.project.logoUrl || '',
        ticker: t.symbol || '',
        type: 'token',
        color: randomHSLColor(),
      }
    })

    console.log('simpleTokenData', simpleTokenData)

    const displayTokens = shuffleArray([...simpleCollectionData, ...simpleTokenData])
    setDisplayTokens(displayTokens)
  }, [collections.data, tokens.data])

  useEffect(() => {
    const p = new PoissonDiskSampling(poissonConfig)
    const points = p
      .fill()
      // Remove points inside center rectangle which is occupied by the headline and swap interface
      .filter(([x, y]: Point) => !isInBounds(x, y, centerRect.x, centerRect.y, centerRect.w, centerRect.h))
      // Order by distance from center, ie idx = 0 is closest to center
      .sort((a: Point, b: Point) => Math.abs(a[0] - w / 2) - Math.abs(b[0] - w / 2))
      .map(([x, y]: Point, idx: number) => {
        const token = !tokenList[idx] ? defaultCoin : tokenList[idx]

        const size = randomInt(40, 96)

        return {
          x,
          y,
          blur: (1 / size) * 1000, // make blur bigger for smaller icons
          size,
          color: token.color,
          logoUrl: token.logoUrl,
          opacity: randomFloat(0.5, 1.0),
          rotation: randomInt(-20, 20),
          delay: Math.abs(x - w / 2) / 800,
          floatDuration: randomFloat(3, 6),
          ticker: token.symbol,
          delta: token.pricePercentChange,
          type: token.type,
          address: token.address,
        }
      })
      // @ts-ignore
      .map((p) => {
        return {
          ...p,
          y: p.y - 0.5 * p.size,
          x: p.x - 0.5 * p.size,
        }
      })

    setPts(points as TokenPoint[])
  }, [])

  const constraintsRef = useRef(null)
  const [cursor, setCursor] = useState(-1)

  return (
    <Container ref={constraintsRef}>
      <Inner>
        {pts.map(
          (
            // @ts-ignore
            point: TokenPoint,
            idx
          ) => {
            return <Token key={`token-${idx}`} point={point} idx={idx} cursor={cursor} setCursor={setCursor} />
          }
        )}
      </Inner>
    </Container>
  )
}

type TokenProps = {
  point: TokenPoint
  idx: number
  cursor: number
  setCursor: (idx: number) => void
}

function Token(props: TokenProps) {
  const { cursor, setCursor, idx, point } = props
  const { x, y, blur, size, rotation, opacity, delay, floatDuration, logoUrl, type, delta, ticker, color, address } =
    point
  // const { logoUrl, type, delta, ticker, color } = displayTokens[idx]

  const navigate = useNavigate()
  const handleOnClick = () => navigate(type === 'COIN' ? `/tokens/ethereum/${address}` : `/nfts/collection/${address}`)

  const borderRadius = size / 8

  const positionerVariants = {
    initial: { scale: 0.5, opacity: 0, rotateX: 15, left: x, top: y + 30 },
    animate: {
      scale: 1,
      opacity: 1,
      rotateX: 0,
      left: x,
      top: y,
    },
  }

  const floatVariants = {
    animate: {
      y: ['-8px', '8px', '-8px'],
      transition: {
        delay: 0,
        duration: floatDuration,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  }

  const rotateVariants = {
    animate: {
      rotate: [rotation - 2, rotation + 2, rotation - 2],
      transition: {
        delay: 0,
        duration: floatDuration,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    hover: {},
  }

  const coinVariants = {
    rest: {
      color,
      opacity,
      scale: 1,
      // rotate: rotation,
    },
    hover: {
      opacity: 1,
      scale: 1.2,
      rotate: randomChoice([0 - rotation, 0 - rotation]),
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.1,
        delay: 0,
        duration: 0.3,
        type: 'spring',
        bounce: 0.5,
      },
    },
  }

  const iconRingVariant1 = {
    rest: { scale: 1, opacity: 0 },
    hover: {
      opacity: 0.3,
      scale: 1.2,
      transition: { duration: 0.3, type: 'spring', bounce: 0.5 },
    },
  }

  const iconRingVariant2 = {
    rest: { scale: 1, opacity: 0 },
    hover: {
      opacity: 0.1,
      scale: 1.4,
      transition: { duration: 0.3, type: 'spring', bounce: 0.5 },
    },
  }

  const hovered = cursor === idx

  return (
    <TokenIconPositioner
      key={`tokenIcon-${idx}`}
      variants={positionerVariants}
      initial="initial"
      animate="animate"
      transition={{ delay, duration: 0.8, type: 'spring', bounce: 0.6 }}
      size={size}
    >
      <FloatContainer
        onMouseEnter={() => setCursor(idx)}
        onMouseLeave={() => setCursor(-1)}
        variants={floatVariants}
        animate="animate"
      >
        <Ticker size={size} color={color} delta={delta} ticker={ticker} animate={hovered ? 'hover' : 'animate'} />
        <RotateContainer variants={rotateVariants} animate="animate">
          <TokenIcon
            size={size}
            blur={blur}
            color={color}
            type={type}
            rotation={rotation}
            logoUrl={logoUrl}
            opacity={opacity}
            initial="rest"
            animate={hovered ? 'hover' : 'animate'}
            borderRadius={borderRadius}
            variants={coinVariants}
            transition={{ delay: 0 }}
            onClick={() => handleOnClick()}
          >
            <TokenIconRing
              variants={iconRingVariant1}
              size={size}
              type={type}
              color={color}
              borderRadius={borderRadius * 1.3}
            />
            <TokenIconRing
              variants={iconRingVariant2}
              size={size}
              type={type}
              color={color}
              borderRadius={borderRadius * 1.6}
            />
          </TokenIcon>
        </RotateContainer>
      </FloatContainer>
    </TokenIconPositioner>
  )
}

const Container = styled.div`
  width: 100%;
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  top: 0;
`

const Inner = styled.div`
  width: 3000px;
  flex-shrink: 0;
  height: 800px;
  position: relative;
  overflow: visible;
`

type TokenIconProps = {
  size: number
  blur: number
  color: string
  type: string
  rotation: number
  opacity: number
  borderRadius: number
  logoUrl: string
}

const TokenIcon = styled(motion.div)<TokenIconProps>`
  border-radius: ${(props) => (props.type === 'COIN' ? '50%' : `${props.borderRadius}px`)}};
  width: ${(props) => `${props.size}px`};
  height: ${(props) => `${props.size}px`};
  background-color:${(props) => `${props.color}`};
  filter: blur(${(props) => `${props.blur}px`});
  background-image: url(${(props) => props.logoUrl});
  background-size: cover;
  background-position: center center;
  transition: filter 0.15s ease-in-out;
  transform-origin: center center;
  position: relative;
  &:hover {
    filter: blur(0);
    cursor: pointer;
  }
`

type TokenIconPositionerProps = {
  size: number
}

const TokenIconPositioner = styled(motion.div)<TokenIconPositionerProps>`
  width: ${(props) => `${props.size}px`};
  height: ${(props) => `${props.size}px`};
  position: absolute;
  transform-origin: center center;
`

const FloatContainer = styled(motion.div)`
  position: absolute;
  transform-origin: center center;
`

const RotateContainer = styled(motion.div)`
  position: absolute;
  transform-origin: center center;
`

type TokenIconRingProps = {
  size: number
  color: string
  type: string
  borderRadius: number
}

const TokenIconRing = styled(motion.div)<TokenIconRingProps>`
  border-radius: ${(props) => (props.type === 'COIN' ? '50%' : `${props.borderRadius}px`)}};
  width: ${(props) => `${props.size}px`};
  height: ${(props) => `${props.size}px`};
  background-color: rgba(0,0,0,0);
  border: 1px solid ${(props) => `${props.color}`};
  
  transform-origin: center center;
  position: absolute;
  pointer-events: all;
`

const PriceContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  justify-content: center;
`

const TickerText = styled(motion.div)`
  font-size: 14px;
  font-weight: 500;
  color: ${(props) => `${props.color}`};
`

const TickerContainer = styled(motion.div)`
  pointer-events: none;
  position: absolute;
  display: flex;
  flex-direction: row;
  gap: 20px;
`

const DeltaText = styled(motion.div)`
  font-size: 12px;
  font-weight: 500;
  color: ${(props) => `${props.color}`};
`

const Delta = styled(motion.div)`
  display: flex;
  flex-direction: row;
`

type TickerProps = {
  color: string
  delta: number
  ticker: string
  size: number
  children?: React.ReactNode
  animate: string
}

function Ticker(props: TickerProps) {
  const priceVariants = {
    rest: { opacity: 0, x: 0 },
    hover: { opacity: 1, x: 8 },
  }
  return (
    <TickerContainer initial="rest" variants={priceVariants} animate={props.animate}>
      <Box flex="none" width={`${props.size}px`} height={`${props.size}px`} />
      <PriceContainer>
        <TickerText color={props.color}>{props.ticker}</TickerText>
        <Delta>
          {(props.delta | 0) === 0 ? <PriceNeutral /> : isNegative(props.delta) ? <PriceArrowDown /> : <PriceArrowUp />}
          <DeltaText>{props.delta}</DeltaText>
        </Delta>
      </PriceContainer>
    </TickerContainer>
  )
}

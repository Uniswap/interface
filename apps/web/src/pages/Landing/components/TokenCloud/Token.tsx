import { motion } from 'framer-motion'
import { useCollectionPromoQuery, useTokenPromoQuery } from 'graphql/data/__generated__/types-and-hooks'
import { getTokenDetailsURL } from 'graphql/data/util'
import { TokenStandard } from 'pages/Landing/assets/approvedTokens'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'

import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { TokenPoint } from '.'
import { Ticker } from './Ticker'
import { randomChoice } from './utils'

const TokenIconPositioner = styled(motion.div)<{ size: number }>`
  width: ${(props) => `${props.size}px`};
  height: ${(props) => `${props.size}px`};
  position: absolute;
  transform-origin: center center;
`

const floatAnimation = keyframes`
  0% {
    transform: translateY(-8px);
  }
  50% {
    transform: translateY(8px);
  }
  100% {
    transform: translateY(-8px);
  }
`

const FloatContainer = styled.div<{ duration?: number }>`
  position: absolute;
  transform-origin: center center;
  animation-name: ${floatAnimation};
  animation-duration: ${(props) => 1000 * (props.duration ?? 0)}ms;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
`

const rotateAnimation = keyframes`
  0% {
    transform: rotate(-22deg);
  }
  100% {
    transform: rotate(22deg);
  }
`

const RotateContainer = styled.div<{ duration?: number }>`
  position: absolute;
  transform-origin: center center;
  animation-fill-mode: forwards;
  animation-name: ${rotateAnimation};
  animation-duration: ${(props) => 1000 * (props.duration ?? 0)}ms;
  animation-iteration-count: infinite;
  animation-timing-function: ease-in-out;
  animation-direction: alternate-reverse;
`
const TokenIconRing = styled(motion.div)<{
  size: number
  color: string
  standard: TokenStandard
  $borderRadius: number
}>`
  border-radius: ${(props) => (props.standard === TokenStandard.ERC20 ? '50%' : `${props.$borderRadius}px`)}};
  width: ${(props) => `${props.size}px`};
  height: ${(props) => `${props.size}px`};
  background-color: rgba(0,0,0,0);
  border: 1px solid ${(props) => `${props.color}`};
  
  transform-origin: center center;
  position: absolute;
  pointer-events: all;
`
const TokenIcon = styled(motion.div)<{
  size: number
  blur: number
  color: string
  standard: TokenStandard
  rotation: number
  opacity: number
  $borderRadius: number
  $logoUrl: string
}>`
    border-radius: ${(props) => (props.standard === TokenStandard.ERC20 ? '50%' : `${props.$borderRadius}px`)}};
    width: ${(props) => `${props.size}px`};
    height: ${(props) => `${props.size}px`};
    background-color:${(props) => `${props.color}`};
    filter: blur(${(props) => `${props.blur}px`});
    background-image: url(${(props) => props.$logoUrl});
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
export function Token(props: {
  point: TokenPoint
  idx: number
  cursor: number
  transition?: boolean
  setCursor: (idx: number) => void
}) {
  const { cursor, setCursor, idx, point } = props
  const {
    x,
    y,
    blur,
    size,
    rotation,
    opacity,
    delay,
    floatDuration,
    logoUrl,
    standard,
    ticker,
    tickerPosition,
    color,
    address,
    chain,
  } = point

  const tokenPromoQuery = useTokenPromoQuery({
    variables: {
      address: address !== NATIVE_CHAIN_ID ? address : undefined,
      chain,
    },
    skip: standard !== TokenStandard.ERC20,
  })
  const collectionPromoQuery = useCollectionPromoQuery({
    variables: {
      addresses: [address],
    },
    skip: standard !== TokenStandard.ERC721,
  })
  const pricePercentChange = useMemo(() => {
    const value =
      standard === TokenStandard.ERC20
        ? tokenPromoQuery.data?.token?.market?.pricePercentChange?.value ?? 0
        : collectionPromoQuery.data?.nftCollections?.edges?.[0].node.markets?.[0].floorPricePercentChange?.value
    return value ?? 0
  }, [
    collectionPromoQuery.data?.nftCollections?.edges,
    tokenPromoQuery.data?.token?.market?.pricePercentChange?.value,
    standard,
  ])

  const navigate = useNavigate()
  const handleOnClick = useMemo(
    () => () =>
      navigate(
        standard === TokenStandard.ERC20
          ? getTokenDetailsURL({
              address,
              chain,
            })
          : `/nfts/collection/${address}`
      ),
    [address, chain, navigate, standard]
  )

  const borderRadius = size / 8

  const [targetX, targetY] = useMemo(() => {
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2
    const r = Math.sqrt(centerX ** 2 + centerY ** 2)
    const theta = Math.atan2(y - centerY, x - centerX)
    const targetX = centerX + 1.5 * r * Math.cos(theta)
    const targetY = centerY + 1.5 * r * Math.sin(theta)
    return [targetX, targetY]
  }, [x, y])

  const positionerVariants = {
    initial: { scale: 0.5, opacity: 0, rotateX: 15, left: x, top: y + 30 },
    animate: {
      scale: 1,
      opacity: 1,
      rotateX: 0,
      left: x,
      top: y,
    },
    exit: {
      scale: 3,
      opacity: 0,
      rotateX: 15,
      left: targetX,
      top: targetY,
    },
  }

  const coinVariants = {
    rest: {
      color,
      opacity,
      scale: 1,
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
  const duration = 200 / (22 - rotation)

  return (
    <TokenIconPositioner
      key={`tokenIcon-${idx}`}
      variants={positionerVariants}
      initial="initial"
      animate={props.transition ? 'exit' : 'animate'}
      transition={
        props.transition
          ? { delay: 0, duration: 2.5, type: 'spring' }
          : { delay, duration: 0.8, type: 'spring', bounce: 0.6 }
      }
      size={size}
    >
      <FloatContainer duration={floatDuration} onMouseEnter={() => setCursor(idx)} onMouseLeave={() => setCursor(-1)}>
        <Ticker
          size={size}
          color={color}
          pricePercentChange={pricePercentChange}
          ticker={ticker}
          tickerPosition={tickerPosition}
          animate={hovered ? 'hover' : 'animate'}
        />
        <RotateContainer duration={duration}>
          <TokenIcon
            size={size}
            blur={blur}
            color={color}
            standard={standard}
            rotation={rotation}
            $logoUrl={logoUrl}
            opacity={opacity}
            initial="rest"
            animate={hovered ? 'hover' : 'animate'}
            $borderRadius={borderRadius}
            variants={coinVariants}
            transition={{ delay: 0 }}
            onClick={() => handleOnClick()}
          >
            <TokenIconRing
              variants={iconRingVariant1}
              size={size}
              standard={standard}
              color={color}
              $borderRadius={borderRadius * 1.3}
            />
            <TokenIconRing
              variants={iconRingVariant2}
              size={size}
              standard={standard}
              color={color}
              $borderRadius={borderRadius * 1.6}
            />
          </TokenIcon>
        </RotateContainer>
      </FloatContainer>
    </TokenIconPositioner>
  )
}

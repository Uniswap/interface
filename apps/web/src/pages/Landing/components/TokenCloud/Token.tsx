import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { getTokenDetailsURL } from 'graphql/data/util'
import { TokenStandard } from 'pages/Landing/assets/approvedTokens'
import { TokenPoint } from 'pages/Landing/components/TokenCloud'
import { Ticker } from 'pages/Landing/components/TokenCloud/Ticker'
import { randomChoice } from 'pages/Landing/components/TokenCloud/utils'
import { startTransition, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flex, styled, type FlexProps } from 'ui/src'
import { validColor } from 'ui/src/theme'
import {
  useCollectionPromoQuery,
  useTokenPromoQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

const TokenIconPositioner = ({
  size,
  delay,
  ...rest
}: FlexProps & {
  size: number
  delay: number
}) => {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const tm = setTimeout(() => {
      startTransition(() => {
        setShow(true)
      })
    }, delay * ONE_SECOND_MS)

    return () => {
      clearTimeout(tm)
    }
  }, [delay])

  if (!show) {
    return null
  }

  return <Flex pointerEvents="auto" width={size} height={size} {...rest} />
}

const FloatContainer = styled(Flex, {
  '$platform-web': {
    position: 'absolute',
    transformOrigin: 'center center',
    animationName: 'token-float-animation',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'linear',
  },

  variants: {
    duration: {
      ':number': (val = 0) => ({
        '$platform-web': {
          animationDuration: `${1000 * val}ms`,
        },
      }),
    },
  } as const,
})

const RotateContainer = styled(Flex, {
  '$platform-web': {
    position: 'absolute',
    transformOrigin: 'center center',
    animationFillMode: 'forwards',
    animationName: 'token-rotate-animation',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'ease-in-out',
    animationDirection: 'alternate-reverse',
  },

  variants: {
    duration: {
      ':number': (val = 0) => ({
        '$platform-web': {
          animationDuration: `${1000 * val}ms`,
        },
      }),
    },
  } as const,
})

const TokenIconRing = styled(Flex, {
  borderWidth: 1,
  borderColor: '$color',
  transformOrigin: 'center center',
  position: 'absolute',

  variants: {
    size: {
      ':number': (val) => ({
        width: val,
        height: val,
      }),
    },

    rounded: {
      true: {
        '$platform-web': {
          borderRadius: '50%',
        },
      },
    },
  } as const,
})

const TokenIcon = styled(Flex, {
  backgroundSize: 'cover',
  backgroundPosition: 'center center',
  transition: 'filter 0.15s ease-in-out',
  transformOrigin: 'center center',

  '$platform-web': {
    willChange: 'filter',
  },

  variants: {
    logoUrl: {
      ':string': (val) => ({
        backgroundImage: `url(${val})`,
      }),
    },

    blur: {
      ':number': (val) => ({
        filter: `blur(${val}px)`,
      }),
    },

    size: {
      ':number': (val) => ({
        width: val,
        height: val,
      }),
    },

    rounded: {
      true: {
        '$platform-web': {
          borderRadius: '50%',
        },
      },
    },
  } as const,
})

export function Token(props: { point: TokenPoint; idx: number; transition?: boolean }) {
  const { point } = props
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
          : `/nfts/collection/${address}`,
      ),
    [address, chain, navigate, standard],
  )

  const borderRadius = size / 8
  const duration = 200 / (22 - rotation)

  return (
    <Flex position="absolute" group="item" top={y} left={x} width={size} height={size} transformOrigin="center center">
      <Flex animation="bouncy" enterStyle={{ y: 30 }}>
        <TokenIconPositioner
          animation="bouncy"
          delay={delay}
          rotate="15deg"
          opacity={1}
          scale={1}
          enterStyle={{
            scale: 0,
            opacity: 0,
            y: 30,
            rotate: '-15deg',
          }}
          exitStyle={{
            scale: 3,
            opacity: 0,
            rotate: '15deg',
            y: 10,
          }}
          size={size}
        >
          <FloatContainer duration={floatDuration}>
            <Ticker
              size={size}
              color={color}
              pricePercentChange={pricePercentChange}
              ticker={ticker}
              tickerPosition={tickerPosition}
            />
            <RotateContainer duration={duration}>
              <TokenIcon
                size={size}
                animation="fast"
                blur={blur}
                backgroundColor={validColor(color)}
                rounded={standard === TokenStandard.ERC20}
                logoUrl={logoUrl}
                opacity={opacity}
                borderRadius={borderRadius}
                onPress={() => handleOnClick()}
                $group-item-hover={{
                  opacity: 1,
                  scale: 1.2,
                  rotate: `${randomChoice([0 - rotation, 0 - rotation])}deg`,
                  filter: 'blur(0)',
                  cursor: 'pointer',
                }}
              >
                <TokenIconRing
                  opacity={0}
                  animation="bouncy"
                  $group-item-hover={{
                    opacity: 0.3,
                    scale: 1.2,
                  }}
                  size={size}
                  rounded={standard === TokenStandard.ERC20}
                  borderColor={validColor(color)}
                  borderRadius={borderRadius * 1.3}
                />
                <TokenIconRing
                  opacity={0}
                  animation="bouncy"
                  $group-item-hover={{
                    opacity: 0.1,
                    scale: 1.4,
                  }}
                  size={size}
                  rounded={standard === TokenStandard.ERC20}
                  borderColor={validColor(color)}
                  borderRadius={borderRadius * 1.6}
                />
              </TokenIcon>
            </RotateContainer>
          </FloatContainer>
        </TokenIconPositioner>
      </Flex>
    </Flex>
  )
}

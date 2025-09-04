import { startTransition, useEffect, useState } from 'react'
import { Flex, type FlexProps, styled } from 'ui/src'
import { validColor } from 'ui/src/theme'
import { ItemData, ItemPoint } from 'uniswap/src/components/IconCloud/IconCloud'
import { randomChoice } from 'uniswap/src/components/IconCloud/utils'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

function TokenIconPositioner({
  size,
  delay,
  ...rest
}: FlexProps & {
  size: number
  delay: number
}): JSX.Element | null {
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
    animationName: 'cloud-float-animation',
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

const ItemContainer = styled(Flex, {
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
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
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

export function CloudItem<T extends ItemData>({
  point,
  renderOuterElement,
  getElementRounded,
  onPress,
}: {
  point: ItemPoint<T>
  renderOuterElement?: (point: ItemPoint<T>) => JSX.Element
  getElementRounded?: (point: ItemPoint<T>) => boolean
  onPress?: (point: ItemPoint<T>) => void
}): JSX.Element {
  const { x, y, blur, size, rotation, opacity, delay, floatDuration, color } = point

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
            {renderOuterElement && renderOuterElement(point)}
            <RotateContainer duration={duration}>
              <ItemContainer
                size={size}
                animation="fast"
                blur={blur}
                backgroundColor={validColor(color)}
                rounded={getElementRounded?.(point)}
                logoUrl={point.itemData.logoUrl}
                opacity={opacity}
                borderRadius={borderRadius}
                $group-item-hover={{
                  opacity: 1,
                  scale: 1.2,
                  rotate: `${randomChoice([0 - rotation, 0 - rotation])}deg`,
                  filter: 'blur(0)',
                  cursor: onPress ? 'pointer' : undefined,
                }}
                onPress={onPress ? (): void => onPress(point) : undefined}
              >
                {getElementRounded && (
                  <>
                    <TokenIconRing
                      opacity={0}
                      animation="bouncy"
                      $group-item-hover={{
                        opacity: 0.3,
                        scale: 1.2,
                      }}
                      size={size}
                      rounded={getElementRounded(point)}
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
                      rounded={getElementRounded(point)}
                      borderColor={validColor(color)}
                      borderRadius={borderRadius * 1.6}
                    />
                  </>
                )}
              </ItemContainer>
            </RotateContainer>
          </FloatContainer>
        </TokenIconPositioner>
      </Flex>
    </Flex>
  )
}

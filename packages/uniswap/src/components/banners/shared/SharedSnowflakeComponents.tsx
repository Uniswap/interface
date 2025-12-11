import { useEffect } from 'react'
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { Snowflake } from 'ui/src/components/icons/Snowflake'
import { Flex } from 'ui/src/components/layout'
import { styled } from 'ui/src/index'
import { useEvent } from 'utilities/src/react/hooks'

// Shared styled components
export const SnowflakeContainer = styled(Flex, {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  overflow: 'hidden',
})

export const MouseGlow = styled(Flex, {
  position: 'absolute',
  background:
    'radial-gradient(circle, rgba(252, 116, 254, 0.8) 0%, rgba(252, 116, 254, 0.6) 30%, rgba(252, 116, 254, 0.2) 60%, rgba(252, 116, 254, 0) 100%)',
  borderRadius: '$rounded32',
  filter: 'blur(40px)',
  pointerEvents: 'none',
  transition: 'opacity 200ms ease-out',
})

// Shared types
interface SnowflakeProps {
  id: number
  size: number
  opacity: number
  blur: number
  left: number
  duration: number
  drift: number
  rotationSpeed: number
  rotationDirection: 1 | -1
  startY: number
}

interface RenderSnowflakesConfig {
  snowflakes: SnowflakeProps[]
  containerHeight: number
  removeSnowflake: (id: number) => void
  getSnowflakeDrift?: (id: number) => { x: number; y: number }
  keyPrefix?: string
}

// Web implementation using CSS animations
export function renderSnowflakesWeb({
  snowflakes,
  containerHeight,
  removeSnowflake,
  getSnowflakeDrift,
  keyPrefix = 'snowflake',
}: RenderSnowflakesConfig): JSX.Element {
  return (
    <>
      <style>
        {/* Generate unique CSS keyframe animation for each snowflake */}
        {snowflakes
          .map((flake) => {
            const totalRotation = flake.rotationSpeed * flake.duration * flake.rotationDirection
            const buffer = 20
            const fallDistance = containerHeight - flake.startY + buffer

            return `
            @keyframes snowfall-${keyPrefix}-${flake.id} {
              from {
                transform: translate(0, 0) rotate(0deg);
              }
              to {
                transform: translate(${flake.drift}px, ${fallDistance}px) rotate(${totalRotation}deg);
              }
            }
          `
          })
          .join('')}
        {`
            .animated-snowflake-${keyPrefix} {
              position: absolute;
              animation-timing-function: ease-in;
              animation-fill-mode: forwards;
              animation-iteration-count: 1;
            }
          `}
      </style>
      {snowflakes.map((flake) => {
        const driftOffset = getSnowflakeDrift?.(flake.id) || { x: 0, y: 0 }

        return (
          // biome-ignore lint/correctness/noRestrictedElements: This is a custom snowflake animation
          <div
            key={`${keyPrefix}-${flake.id}`}
            className={`animated-snowflake-${keyPrefix}`}
            style={{
              left: `${flake.left}%`,
              top: `${flake.startY}px`,
              animationName: `snowfall-${keyPrefix}-${flake.id}`,
              animationDuration: `${flake.duration}s`,
              filter: flake.blur > 0 ? `blur(${flake.blur}px)` : 'none',
              opacity: flake.opacity,
            }}
            onAnimationEnd={() => removeSnowflake(flake.id)}
          >
            {/* Inner div applies momentum-based drift on top of fall animation */}
            {/* biome-ignore lint/correctness/noRestrictedElements: Drift momentum wrapper */}
            <div
              style={{
                transform: `translate(${driftOffset.x}px, ${driftOffset.y}px)`,
              }}
            >
              <Snowflake color="$white" size={flake.size} />
            </div>
          </div>
        )
      })}
    </>
  )
}

// Native implementation using React Native Reanimated
interface SnowflakeAnimatedProps {
  flake: SnowflakeProps
  fallDistance: number
  totalRotation: number
  onComplete: () => void
}

function SnowflakeAnimated({ flake, fallDistance, totalRotation, onComplete }: SnowflakeAnimatedProps): JSX.Element {
  const translateY = useSharedValue(0)
  const translateX = useSharedValue(0)
  const rotation = useSharedValue(0)
  const stableOnComplete = useEvent(onComplete)

  useEffect(() => {
    translateY.value = withTiming(
      fallDistance,
      {
        duration: flake.duration * 1000,
        easing: Easing.in(Easing.ease),
      },
      (finished) => {
        if (finished) {
          runOnJS(stableOnComplete)()
        }
      },
    )
    translateX.value = withTiming(flake.drift, {
      duration: flake.duration * 1000,
      easing: Easing.inOut(Easing.ease),
    })
    rotation.value = withTiming(totalRotation, {
      duration: flake.duration * 1000,
      easing: Easing.linear,
    })
  }, [fallDistance, flake.drift, totalRotation, flake.duration, stableOnComplete])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { rotate: `${rotation.value}deg` }],
    opacity: flake.opacity,
  }))

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: `${flake.left}%`,
          top: flake.startY,
        },
        animatedStyle,
      ]}
    >
      <Snowflake color="$white" size={flake.size} />
    </Animated.View>
  )
}

export function renderSnowflakesNative({
  snowflakes,
  containerHeight,
  removeSnowflake,
  keyPrefix = 'snowflake',
}: RenderSnowflakesConfig): JSX.Element[] {
  return snowflakes.map((flake) => {
    const fallDistance = containerHeight - flake.startY + 20
    const totalRotation = flake.rotationSpeed * flake.duration * flake.rotationDirection

    return (
      <SnowflakeAnimated
        key={`${keyPrefix}-${flake.id}`}
        flake={flake}
        fallDistance={fallDistance}
        totalRotation={totalRotation}
        onComplete={() => removeSnowflake(flake.id)}
      />
    )
  })
}

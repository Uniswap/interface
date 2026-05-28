import { Children, ReactNode, useEffect, useState } from 'react'
import { AnimatePresence, styled } from 'tamagui'
import { Flex } from 'ui/src/components/layout'
import { animations } from 'ui/src/theme/animations'
import { usePrevious } from 'utilities/src/react/hooks'

type TransitionDirection = 'forward' | 'backward' | 'up' | 'down'
export type AnimationType = 'fade' | TransitionDirection

type AnimationKey = keyof (typeof animations)['animations']
type AnimationTransitionType = 'unset' | AnimationKey | null | undefined

function getAnimationOffsets(
  animationType: AnimationType,
  distance: number,
): { enterOffset: object; exitOffset: object } {
  switch (animationType) {
    case 'forward':
      return { enterOffset: { x: distance }, exitOffset: { x: -distance } }
    case 'backward':
      return { enterOffset: { x: -distance }, exitOffset: { x: distance } }
    case 'up':
      return { enterOffset: { y: distance }, exitOffset: { y: -distance } }
    case 'down':
      return { enterOffset: { y: -distance }, exitOffset: { y: distance } }
    case 'fade':
    default:
      return { enterOffset: {}, exitOffset: {} }
  }
}

const AnimatedItem = styled(Flex, {
  x: 0,
  opacity: 1,
  width: '100%',
  grow: true,

  variants: {
    going: ({
      type,
      distance = 10,
      disableFade = false,
    }: {
      type: AnimationType
      distance?: number
      disableFade?: boolean
    }) => {
      const { enterOffset, exitOffset } = getAnimationOffsets(type, distance)
      return {
        enterStyle: {
          ...enterOffset,
          ...(disableFade ? {} : { opacity: 0 }),
        },
        exitStyle: {
          zIndex: 0,
          ...exitOffset,
          ...(disableFade ? {} : { opacity: 0 }),
        },
      }
    },
  },
} as const)

AnimatedItem.displayName = 'AnimatedItem'

export function TransitionItem({
  animationType = 'fade',
  childKey,
  animation = 'fastHeavy',
  distance,
  disableFade,
  children,
}: {
  animationType?: AnimationType
  childKey?: string | number
  animation?: Omit<AnimationTransitionType, 'unset'>
  distance?: number
  disableFade?: boolean
  children?: ReactNode
}): JSX.Element {
  return (
    <AnimatePresence exitBeforeEnter custom={{ going: { type: animationType, distance, disableFade } }} initial={false}>
      {children && (
        <AnimatedItem
          key={childKey ?? 'animated-item'}
          animation={animation}
          going={{ type: animationType, distance, disableFade }}
        >
          {children}
        </AnimatedItem>
      )}
    </AnimatePresence>
  )
}

export function AnimateTransition({
  currentIndex,
  animationType = 'fade',
  animation = 'fastHeavy',
  distance,
  disableFade,
  children,
}: {
  currentIndex: number
  children: ReactNode
  animationType?: AnimationType
  distance?: number
  animation?: Omit<AnimationTransitionType, 'unset'>
  disableFade?: boolean
}): JSX.Element {
  const childrenArray = Children.toArray(children)

  return (
    <AnimatePresence exitBeforeEnter custom={{ going: { type: animationType, distance, disableFade } }} initial={false}>
      <AnimatedItem
        key={`slide-item-${currentIndex}`}
        animation={animation}
        going={{ type: animationType, distance, disableFade }}
      >
        {childrenArray[currentIndex]}
      </AnimatedItem>
    </AnimatePresence>
  )
}

export function AnimatedPager({
  currentIndex,
  animation,
  distance,
  disableFade,
  children,
}: {
  currentIndex: number
  animation?: Omit<AnimationTransitionType, 'unset'>
  distance?: number
  disableFade?: boolean
  children: ReactNode
}): JSX.Element {
  const prevIndex = usePrevious(currentIndex)
  const [direction, setDirection] = useState<TransitionDirection>('forward')
  useEffect(() => {
    if (prevIndex === undefined) {
      return
    }
    if (currentIndex > prevIndex) {
      setDirection('forward')
    } else if (currentIndex < prevIndex) {
      setDirection('backward')
    }
  }, [currentIndex, prevIndex])
  return (
    <AnimateTransition
      animationType={direction}
      distance={distance}
      disableFade={disableFade}
      currentIndex={currentIndex}
      animation={animation}
    >
      {children}
    </AnimateTransition>
  )
}

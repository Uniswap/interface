import { Children, ReactNode, useEffect, useState } from 'react'
import { AnimatePresence, styled } from 'tamagui'
import { Flex } from 'ui/src/components/layout'
import { animations } from 'ui/src/theme/animations'
import { usePrevious } from 'utilities/src/react/hooks'

type TransitionDirection = 'forward' | 'backward' | 'up' | 'down'
type AnimationType = 'fade' | TransitionDirection

type AnimationKey = keyof (typeof animations)['animations']
type AnimationTransitionType = 'unset' | AnimationKey | null | undefined

const AnimationStyle: { [key in AnimationType]: { enter: object; exit: object } } = {
  fade: {
    enter: {},
    exit: {},
  },
  forward: {
    enter: { x: 10 },
    exit: { x: -10 },
  },
  backward: {
    enter: { x: -10 },
    exit: { x: 10 },
  },
  up: {
    enter: { y: 10 },
    exit: { y: -10 },
  },
  down: {
    enter: { y: -10 },
    exit: { y: 10 },
  },
}

const AnimatedItem = styled(Flex, {
  x: 0,
  opacity: 1,
  width: '100%',
  grow: true,

  variants: {
    going: (going: AnimationType) => ({
      enterStyle: {
        ...AnimationStyle[going as AnimationType].enter,
        opacity: 0,
      },
      exitStyle: {
        zIndex: 0,
        ...AnimationStyle[going as AnimationType].exit,
        opacity: 0,
      },
    }),
  },
} as const)

export function TransitionItem({
  animationType = 'fade',
  childKey,
  animation,
  children,
}: {
  animationType?: AnimationType
  childKey?: string | number
  animation?: AnimationTransitionType
  children?: ReactNode
}): JSX.Element {
  return (
    <AnimatePresence exitBeforeEnter custom={{ going: animationType }} initial={false}>
      {children && (
        <AnimatedItem key={childKey ?? 'animated-item'} animation={animation ?? 'fastHeavy'} going={animationType}>
          {children}
        </AnimatedItem>
      )}
    </AnimatePresence>
  )
}

export function AnimateTransition({
  currentIndex,
  animationType = 'fade',
  children,
}: {
  currentIndex: number
  children: ReactNode
  animationType?: AnimationType
}): JSX.Element {
  const childrenArray = Children.toArray(children)

  return (
    <AnimatePresence exitBeforeEnter custom={{ going: animationType }} initial={false}>
      <AnimatedItem key={`slide-item-${currentIndex}`} animation="fastHeavy" going={animationType}>
        {childrenArray[currentIndex]}
      </AnimatedItem>
    </AnimatePresence>
  )
}

export function AnimatedPager({ children, currentIndex }: { currentIndex: number; children: ReactNode }): JSX.Element {
  const prevIndex = usePrevious(currentIndex)
  const [direction, setDirection] = useState<TransitionDirection>('forward')
  useEffect(() => {
    if (!prevIndex) {
      return
    }
    if (currentIndex > prevIndex) {
      setDirection('forward')
    } else if (currentIndex < prevIndex) {
      setDirection('backward')
    }
  }, [currentIndex, prevIndex, setDirection])
  return (
    <AnimateTransition animationType={direction} currentIndex={currentIndex}>
      {children}
    </AnimateTransition>
  )
}

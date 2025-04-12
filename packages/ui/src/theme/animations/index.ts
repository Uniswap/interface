import { createAnimations } from '@tamagui/animations-moti'
import { Easing } from 'react-native-reanimated'
import { delayAnimations200ms } from 'ui/src/theme/animations/delay200ms'

export const animations = createAnimations({
  '100ms': {
    type: 'timing',
    duration: 100,
  },
  '125ms': {
    type: 'timing',
    duration: 125,
    easing: Easing.inOut(Easing.quad),
  },
  '125msDelayed': {
    type: 'timing',
    duration: 125,
    easing: Easing.inOut(Easing.quad),
    delay: 250,
  },
  '125msDelayedLong': {
    type: 'timing',
    duration: 125,
    easing: Easing.inOut(Easing.quad),
    delay: 2000,
  },
  '200ms': {
    type: 'timing',
    duration: 200,
  },
  ...delayAnimations200ms,
  '300ms': {
    type: 'timing',
    duration: 300,
  },
  '80ms-ease-in-out': {
    type: 'timing',
    duration: 80,
    easing: Easing.inOut(Easing.quad),
  },
  stiff: {
    type: 'spring',
    mass: 1,
    damping: 200,
    stiffness: 400,
  },
  bouncy: {
    type: 'spring',
    damping: 10,
    mass: 0.9,
    stiffness: 100,
  },
  semiBouncy: {
    type: 'spring',
    damping: 12,
    mass: 0.7,
    stiffness: 100,
  },
  lazy: {
    type: 'spring',
    damping: 20,
    stiffness: 60,
  },
  quick: {
    type: 'spring',
    damping: 20,
    mass: 1.2,
    stiffness: 250,
  },
  quicker: {
    type: 'spring',
    damping: 18,
    mass: 0.9,
    stiffness: 390,
  },
  // TODO(TAM-49): the animation config prop inline isn't passing delay, need to
  // fix on tamagui side then we can remove this and just use quicker + add
  // delay inline
  quickishDelayed: {
    type: 'spring',
    damping: 18,
    mass: 0.9,
    stiffness: 200,
    delay: 70,
  },
  fast: {
    type: 'spring',
    damping: 75,
    stiffness: 1000,
    mass: 1,
  },
  fastHeavy: {
    type: 'spring',
    damping: 75,
    stiffness: 1000,
    mass: 1.4,
  },
  fastExit: {
    type: 'spring',
    damping: 200,
    stiffness: 1250,
    mass: 1,
  },
  fastExitHeavy: {
    type: 'spring',
    damping: 200,
    stiffness: 1250,
    mass: 1.4,
  },
  simple: {
    type: 'timing',
    duration: 80,
  },
})

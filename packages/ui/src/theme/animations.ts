import { createAnimations } from '@tamagui/animations-moti'

export const animations = createAnimations({
  '100ms': {
    type: 'timing',
    duration: 100,
  },
  '200ms': {
    type: 'timing',
    duration: 200,
  },
  '300ms': {
    type: 'timing',
    duration: 300,
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
})

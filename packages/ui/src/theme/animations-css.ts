import { createAnimations } from '@tamagui/animations-css'

const smoothBezier = 'cubic-bezier(0.215, 0.610, 0.355, 1.000)'

export const animations = createAnimations({
  '100ms': 'ease-in-out 100ms',
  '200ms': 'ease-in-out 200ms',
  '300ms': 'ease-in-out 300ms',
  bouncy: `${smoothBezier} 300ms`,
  semiBouncy: `${smoothBezier} 200ms`,
  lazy: `${smoothBezier} 800ms`,
  quick: `${smoothBezier} 400ms`,
  quicker: `${smoothBezier} 300ms`,
})

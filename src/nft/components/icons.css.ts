import { keyframes, style } from '@vanilla-extract/css'

const rotate = keyframes({
  from: {
    transform: 'rotate(0deg)',
  },
  to: {
    transform: 'rotate(360deg)',
  },
})
export const clockSpinArrows = style({
  animation: `${rotate} 1s linear infinite`,
  transformOrigin: '50% 50%',
})

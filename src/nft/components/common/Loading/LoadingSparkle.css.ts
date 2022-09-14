import { keyframes, style } from '@vanilla-extract/css'

const pathAnim = keyframes({
  '0%': {
    opacity: '0.2',
  },
  '100%': {
    opacity: '1',
  },
})

const pathAnimCommonProps = {
  animationDirection: 'alternate',
  animationTimingFunction: 'linear',
  animation: `0.5s infinite ${pathAnim}`,
}

export const path = style({
  selectors: {
    '&:nth-child(1)': {
      ...pathAnimCommonProps,
    },
    '&:nth-child(2)': {
      animationDelay: '0.1s',
      ...pathAnimCommonProps,
    },
    '&:nth-child(3)': {
      animationDelay: '0.2s',
      ...pathAnimCommonProps,
    },
  },
})

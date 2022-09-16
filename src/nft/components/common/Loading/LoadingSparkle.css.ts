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
}

export const path = style({
  selectors: {
    '&:nth-child(1)': {
      animation: `0.5s infinite ${pathAnim}`,
      ...pathAnimCommonProps,
    },
    '&:nth-child(2)': {
      animation: `0.5s infinite ${pathAnim}`,
      animationDelay: '0.1s',
      ...pathAnimCommonProps,
    },
    '&:nth-child(3)': {
      animation: `0.5s infinite ${pathAnim}`,
      animationDelay: '0.2s',
      ...pathAnimCommonProps,
    },
  },
})

import { style } from '@vanilla-extract/css'

export const list = style({
  overflowAnchor: 'none',
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  selectors: {
    '&::-webkit-scrollbar': {
      display: 'none',
    },
  },
})

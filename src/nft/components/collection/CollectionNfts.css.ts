import { style } from '@vanilla-extract/css'

import { breakpoints, sprinkles } from '../../css/sprinkles.css'

export const assetList = style([
  sprinkles({
    display: 'grid',
    gap: { sm: '8', md: '8', lg: '12', xl: '16' },
  }),
  {
    //This treatment of the grid still uses minmax, but enforces an amount of grid items per breakpoint. This means that when the bag and filter panels appear, we no longer get layout thrash and have a consistent animation as the width changes. It uses calc() and subtracts the grid gap to ensure the min size will always fit without wrapping.
    gridTemplateColumns: 'repeat(auto-fill, minmax(calc(100%/2 - 8px), 1fr) )',
    '@media': {
      [`screen and (min-width: ${breakpoints.md}px)`]: {
        gridTemplateColumns: 'repeat(auto-fill, minmax(calc(100%/3 - 8px), 1fr) )',
      },
      [`screen and (min-width: ${breakpoints.lg}px)`]: {
        gridTemplateColumns: 'repeat(auto-fill, minmax(calc(100%/3 - 12px), 1fr) )',
      },
      [`screen and (min-width: ${breakpoints.xl}px)`]: {
        gridTemplateColumns: 'repeat(auto-fill, minmax(calc(100%/4 - 16px), 1fr) )',
      },
      [`screen and (min-width: ${breakpoints.xxl}px)`]: {
        gridTemplateColumns: 'repeat(auto-fill, minmax(calc(100%/5 - 16px), 1fr) )',
      },
      [`screen and (min-width: ${breakpoints.xxxl}px)`]: {
        gridTemplateColumns: 'repeat(auto-fill, minmax(calc(100%/7 - 16px), 1fr) )',
      },
    },
  },
])

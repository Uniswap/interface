import { style } from '@vanilla-extract/css'
import { breakpoints, sprinkles, themeVars } from 'nft/css/sprinkles.css'

export const cartContainer = style([
  sprinkles({
    borderRadius: '20',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'medGray',
  }),
  {
    '@media': {
      [`screen and (max-width: ${breakpoints.md}px)`]: {
        borderRadius: '0',
      },
    },
  },
])

export const cartAssets = style([
  sprinkles({
    maxHeight: 'inherit',
  }),
  {
    '@media': {
      [`screen and (min-width: ${breakpoints.md}px)`]: {
        maxHeight: '55vh',
      },
    },
    '::-webkit-scrollbar': { display: 'none' },
    scrollbarWidth: 'none',
  },
])

export const closeIcon = style({
  transform: 'rotate(90deg)',
  float: 'right',
  paddingTop: '1px',
})

export const cartFooter = style({
  borderTop: `1px solid ${themeVars.colors.lightGray}`,
})

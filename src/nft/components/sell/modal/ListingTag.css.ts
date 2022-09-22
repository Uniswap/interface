import { style } from '@vanilla-extract/css'
import { breakpoints, sprinkles } from 'nft/css/sprinkles.css'

export const tagContainer = style([
  sprinkles({
    borderRadius: '20',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'backgroundOutline',
  }),
  {
    '@media': {
      [`screen and (max-width: ${breakpoints.md}px)`]: {
        borderRadius: '0',
      },
    },
  },
])

export const tagAssets = style([
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

export const orderButton = style([
  sprinkles({
    width: 'full',
    paddingY: '12',
    paddingX: '0',
  }),
  {
    ':hover': {
      boxShadow: 'none',
    },
  },
])

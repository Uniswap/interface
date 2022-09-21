import { style } from '@vanilla-extract/css'
import { subhead } from 'nft/css/common.css'
import { breakpoints, sprinkles, vars } from 'nft/css/sprinkles.css'

export const bagContainer = style([
  sprinkles({
    position: 'fixed',
    top: { sm: '0', md: '72' },
    width: 'full',
    height: 'full',
    right: '0',
    background: 'lightGray',
    color: 'blackBlue',
    paddingTop: '20',
    paddingBottom: '24',
    zIndex: { sm: 'offcanvas', md: '3' },
  }),
  {
    '@media': {
      [`(min-width: ${breakpoints.md}px)`]: {
        width: '316px',
        height: 'calc(100vh - 72px)',
      },
    },
  },
])

export const assetsContainer = style([
  sprinkles({
    paddingX: '32',
    maxHeight: 'full',
    overflowY: 'scroll',
  }),
  {
    '::-webkit-scrollbar': { display: 'none' },
    scrollbarWidth: 'none',
  },
])

export const header = style([
  subhead,
  sprinkles({
    color: 'blackBlue',
    justifyContent: 'space-between',
  }),
  {
    lineHeight: '24px',
  },
])

export const clearAll = style([
  sprinkles({
    color: 'placeholder',
    cursor: 'pointer',
    fontWeight: 'semibold',
  }),
  {
    ':hover': {
      color: vars.color.blue400,
    },
  },
])

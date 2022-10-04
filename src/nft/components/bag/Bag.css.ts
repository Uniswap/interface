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
    background: 'backgroundSurface',
    color: 'textPrimary',
    paddingTop: '20',
    paddingBottom: '24',
  }),
  {
    '@media': {
      [`(min-width: ${breakpoints.md}px)`]: {
        width: '360px',
        height: 'calc(100vh - 72px)',
      },
    },
  },
])

export const assetsContainer = style([
  sprinkles({
    paddingX: '16',
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
    color: 'textPrimary',
    justifyContent: 'space-between',
  }),
  {
    lineHeight: '24px',
  },
])

export const clearAll = style([
  sprinkles({
    color: 'textTertiary',
    cursor: 'pointer',
    fontWeight: 'semibold',
  }),
  {
    ':hover': {
      color: vars.color.blue400,
    },
  },
])

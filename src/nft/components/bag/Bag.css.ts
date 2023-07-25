import { style } from '@vanilla-extract/css'
import { breakpoints, sprinkles } from 'nft/css/sprinkles.css'

export const assetsContainer = style([
  sprinkles({
    paddingX: '20',
    maxHeight: 'full',
    overflowY: 'scroll',
  }),
  {
    '::-webkit-scrollbar': { display: 'none' },
    scrollbarWidth: 'none',
  },
])

export const bagContainer = style([
  sprinkles({
    position: 'fixed',
    top: { sm: '0', md: '72' },
    width: 'full',
    height: 'full',
    right: '0',
    background: 'surface1',
    borderLeftStyle: 'solid',
    borderColor: 'surface3',
    borderWidth: '1px',
    color: 'neutral1',
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

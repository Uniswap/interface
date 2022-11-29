import { style } from '@vanilla-extract/css'
import { sprinkles } from 'nft/css/sprinkles.css'

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

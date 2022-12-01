import { style } from '@vanilla-extract/css'
import { sprinkles } from 'nft/css/sprinkles.css'

export const removeAsset = style([
  sprinkles({
    position: 'absolute',
    cursor: 'pointer',
  }),
  {
    bottom: '-4px',
    left: '24px',
  },
])

import { style } from '@vanilla-extract/css'
import { sprinkles } from 'nft/css/sprinkles.css'

export const orderButton = style([
  {
    padding: '12px 0',
    ':hover': {
      boxShadow: 'none',
    },
  },
  sprinkles({
    width: 'full',
  }),
])

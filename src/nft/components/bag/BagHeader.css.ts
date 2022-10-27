import { style } from '@vanilla-extract/css'
import { headlineSmall } from 'nft/css/common.css'
import { sprinkles } from 'nft/css/sprinkles.css'

export const header = style([
  headlineSmall,
  sprinkles({
    color: 'textPrimary',
    justifyContent: 'space-between',
  }),
  {
    lineHeight: '24px',
  },
])

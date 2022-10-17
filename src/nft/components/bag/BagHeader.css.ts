import { style } from '@vanilla-extract/css'
import { headlineSmall } from 'nft/css/common.css'
import { sprinkles, vars } from 'nft/css/sprinkles.css'

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

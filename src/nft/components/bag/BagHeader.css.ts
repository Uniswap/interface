import { style } from '@vanilla-extract/css'
import { subhead } from 'nft/css/common.css'
import { sprinkles, vars } from 'nft/css/sprinkles.css'

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

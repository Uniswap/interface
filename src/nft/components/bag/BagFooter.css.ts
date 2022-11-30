import { style } from '@vanilla-extract/css'
import { body } from 'nft/css/common.css'
import { sprinkles } from 'nft/css/sprinkles.css'

export const footerContainer = sprinkles({
  paddingX: '16',
})

export const footer = style([
  sprinkles({
    background: 'backgroundModule',
    color: 'textPrimary',
    paddingX: '16',
    paddingY: '12',
    borderBottomLeftRadius: '12',
    borderBottomRightRadius: '12',
  }),
])

export const payButton = style([
  body,
  sprinkles({
    background: 'accentAction',
    border: 'none',
    borderRadius: '12',
    paddingY: '12',
    fontWeight: 'semibold',
    cursor: 'pointer',
    justifyContent: 'center',
    gap: '16',
  }),
  {
    ':disabled': {
      opacity: '0.6',
      cursor: 'auto',
    },
  },
])

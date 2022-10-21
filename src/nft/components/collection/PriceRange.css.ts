import { style } from '@vanilla-extract/css'
import { body } from 'nft/css/common.css'
import { sprinkles } from 'nft/css/sprinkles.css'

export const priceInput = style([
  body,
  sprinkles({
    backgroundColor: 'transparent',
    padding: '12',
    borderRadius: '12',
    borderStyle: 'solid',
    borderWidth: '1.5px',
  }),
])

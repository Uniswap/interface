import { style } from '@vanilla-extract/css'
import { body } from 'nft/css/common.css'

export const priceInput = style([
  body,
  {
    backgroundColor: 'transparent',
    padding: '12px',
    borderRadius: '12px',
    borderStyle: 'solid',
    borderWidth: '1.5px',
  },
])

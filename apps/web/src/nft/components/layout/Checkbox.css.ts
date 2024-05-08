import { style } from '@vanilla-extract/css'
import { sprinkles } from 'nft/css/sprinkles.css'

export const checkbox = style([
  sprinkles({
    display: 'inline-block',
    marginRight: '1',
    borderRadius: '4',
    height: '24',
    width: '24',
    borderStyle: 'solid',
    borderWidth: '2px',
  }),
])

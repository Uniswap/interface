import { style } from '@vanilla-extract/css'

import { sprinkles } from '../../css/sprinkles.css'

export const overlay = style([
  sprinkles({
    top: '0',
    left: '0',
    width: 'full',
    height: 'full',
    position: 'fixed',
    display: 'block',
    background: 'black',
    zIndex: '3',
  }),
  {
    opacity: 0.75,
    overflow: 'hidden',
  },
])

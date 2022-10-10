import { style } from '@vanilla-extract/css'

import { sprinkles } from '../../css/sprinkles.css'

export const overlay = style([
  sprinkles({
    top: '0',
    left: '0',
    width: 'viewWidth',
    height: 'viewHeight',
    position: 'fixed',
    display: 'block',
    background: 'black',
    zIndex: 'modalBackdrop',
  }),
  {
    opacity: 0.72,
    overflow: 'hidden',
  },
])

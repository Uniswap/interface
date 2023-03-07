import { style } from '@vanilla-extract/css'
import { Z_INDEX } from 'theme/zIndex'

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
  }),
  {
    opacity: 0.72,
    overflow: 'hidden',
    zIndex: Z_INDEX.modalBackdrop - 2,
  },
])

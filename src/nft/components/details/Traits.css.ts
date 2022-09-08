import { style } from '@vanilla-extract/css'

import { sprinkles } from '../../css/sprinkles.css'

export const grid = style([
  sprinkles({ gap: '16', display: 'grid' }),
  {
    gridTemplateColumns: 'repeat(4, 1fr)',
    '@media': {
      '(max-width: 1512px)': {
        gridTemplateColumns: 'repeat(3, 1fr)',
      },
      '(max-width: 515px)': {
        gridTemplateColumns: 'repeat(2, 1fr)',
      },
    },
  },
])

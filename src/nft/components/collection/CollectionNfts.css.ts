import { style } from '@vanilla-extract/css'

import { sprinkles } from '../../css/sprinkles.css'

export const assetList = style([
  sprinkles({
    display: 'grid',
    marginTop: '24',
    gap: { mobile: '8', tablet: '12', tabletXl: '20' },
  }),
  {
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr) )',
    '@media': {
      'screen and (min-width: 708px)': {
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr) )',
      },
      'screen and (min-width: 1185px)': {
        gridTemplateColumns: 'repeat(auto-fill, minmax(1fr, 280px) )',
      },
    },
  },
])

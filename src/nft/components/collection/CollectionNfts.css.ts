import { style } from '@vanilla-extract/css'

import { sprinkles } from '../../css/sprinkles.css'

export const assetList = style([
  sprinkles({
    display: 'grid',
    gap: { sm: '8', md: '12', lg: '16', xxxl: '20' },
  }),
  {
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr) )',
    '@media': {
      'screen and (min-width: 640px)': {
        gridTemplateColumns: 'repeat(auto-fill, calc(33% - 8px) )',
      },
      'screen and (min-width: 960px)': {
        gridTemplateColumns: 'repeat(auto-fill, calc(33% - 8px) )',
      },
      'screen and (min-width: 1440px)': {
        gridTemplateColumns: 'repeat(auto-fill, calc(25% - 16px) )',
      },
      'screen and (min-width: 1680px)': {
        gridTemplateColumns: 'repeat(auto-fill, calc(14.2857% - 16px) )',
      },
    },
  },
])

export const actionBarContainer = style([{ marginLeft: '-16px', width: 'calc(100% + 16px)' }])

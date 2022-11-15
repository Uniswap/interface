import { style } from '@vanilla-extract/css'

import { sprinkles } from '../../css/sprinkles.css'

export const assetList = style([
  sprinkles({
    display: 'grid',
    gap: { sm: '8', md: '8', lg: '12', xl: '16', xxl: '20', xxxl: '20' },
  }),
  {
    gridTemplateColumns: 'repeat(auto-fill, minmax(calc(100%/2 - 8px), 1fr) )',
    '@media': {
      'screen and (min-width: 768px)': {
        gridTemplateColumns: 'repeat(auto-fill, minmax(calc(100%/3 - 8px), 1fr) )',
      },
      'screen and (min-width: 1024px)': {
        gridTemplateColumns: 'repeat(auto-fill, minmax(calc(100%/3 - 12px), 1fr) )',
      },
      'screen and (min-width: 1280px)': {
        gridTemplateColumns: 'repeat(auto-fill, minmax(calc(100%/4 - 16px), 1fr) )',
      },
      'screen and (min-width: 1536px)': {
        gridTemplateColumns: 'repeat(auto-fill, minmax(calc(100%/5 - 20px), 1fr) )',
      },
      'screen and (min-width: 1920px)': {
        gridTemplateColumns: 'repeat(auto-fill, minmax(calc(100%/7 - 20px), 1fr) )',
      },
    },
  },
])

export const actionBarContainer = style([{ marginLeft: '-16px', width: 'calc(100% + 32px)' }])

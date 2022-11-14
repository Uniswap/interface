import { style } from '@vanilla-extract/css'

import { sprinkles } from '../../css/sprinkles.css'

export const assetList = style([
  sprinkles({
    display: 'grid',
    gap: { sm: '8', md: '12', lg: '16', xxxl: '20' },
  }),
  {
    paddingLeft: 14,
    paddingRight: 14,
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr) )',
    '@media': {
      'screen and (min-width: 640px)': {
        gridTemplateColumns: 'repeat(auto-fill, calc(33% - 12px) )',
      },
      'screen and (min-width: 960px)': {
        gridTemplateColumns: 'repeat(auto-fill, calc(33% - 12px) )',
      },
      'screen and (min-width: 1440px)': {
        gridTemplateColumns: 'repeat(auto-fill, calc(25% - 16px) )',
      },
      'screen and (min-width: 1680px)': {
        gridTemplateColumns: 'repeat(auto-fill, calc(14.25% - 20px) )',
      },
    },
  },
])

// gap: { sm: '8', md: '12', lg: '16', xxxl: '20' },
// }),
// {
//   boxSizing: 'border-box',
//   WebkitBoxSizing: 'border-box',
//   '@media': {
//     'screen and (min-width: 640px)': {
//       maxWidth: 'calc(33% - 8px)',
//     },
//     'screen and (min-width: 960px)': {
//       maxWidth: 'calc(33% - 12px)',
//     },
//     'screen and (min-width: 1200px)': {
//       maxWidth: 'calc(25% - 16px)',
//     },
//     'screen and (min-width: 1440px)': {
//       maxWidth: 'calc(25% - 16px)',
//     },
//     'screen and (min-width: 1680px)': {
//       maxWidth: 'calc(14.25% - 20px)',
//     },
//   },

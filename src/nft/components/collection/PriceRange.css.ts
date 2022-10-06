import { style } from '@vanilla-extract/css'
import { sprinkles } from 'nft/css/sprinkles.css'
import { themeVars } from 'nft/css/sprinkles.css'

// https://www.npmjs.com/package/react-slider
// https://codesandbox.io/s/peaceful-pine-gqszx6?file=/src/styles.css:587-641

export const sliderLight = style([
  sprinkles({
    height: '8',
    marginTop: '20',
    borderRadius: '8',
    width: 'full',
  }),
])

export const sliderDark = style([
  sliderLight,
  sprinkles({
    backgroundColor: 'accentAction',
  }),
])

export const tracker = style([
  sprinkles({
    backgroundColor: 'accentAction',
    height: '8',
  }),
  {
    selectors: {
      '&:nth-child(1)': {
        backgroundColor: themeVars.colors.accentActionSoft,
        borderRadius: 8,
        opacity: 0.65,
      },
      '&:nth-child(3)': {
        backgroundColor: themeVars.colors.accentActionSoft,
        borderRadius: 8,
        opacity: 0.65,
      },
    },
  },
])

export const thumb = style([
  sprinkles({
    width: '12',
    height: '20',
    borderRadius: '4',
    cursor: 'pointer',
  }),
  {
    backgroundColor: '#F5F6FC',
    boxShadow: '4px 4px 10px rgba(0, 0, 0, 0.24), 2px 2px 4px rgba(0, 0, 0, 0.12), 1px 2px 2px rgba(0, 0, 0, 0.12)',
    top: -6,
  },
])

import { style } from '@vanilla-extract/css'
import { body } from 'nft/css/common.css'
import { sprinkles, themeVars } from 'nft/css/sprinkles.css'

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
    boxShadow: 'shallow',
    backgroundColor: 'grey50',
  }),
  {
    top: -6,
  },
])

export const priceInput = style([
  body,
  sprinkles({
    backgroundColor: 'transparent',
    padding: '12',
    borderRadius: '12',
    borderStyle: 'solid',
    borderWidth: '1.5px',
  }),
])

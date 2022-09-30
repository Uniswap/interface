import { style } from '@vanilla-extract/css'
import { sprinkles } from 'nft/css/sprinkles.css'
import { themeVars } from 'nft/css/sprinkles.css'
import { vars } from 'nft/css/sprinkles.css'

// https://www.npmjs.com/package/react-slider
// https://codesandbox.io/s/peaceful-pine-gqszx6?file=/src/styles.css:587-641

export const slider = style([
  sprinkles({
    // backgroundColor: 'backgroundAction',
    height: '8',
    marginTop: '20',
    borderRadius: '8',
  }),
  {
    width: 278,
  },
])

export const tracker = style([
  sprinkles({
    // backgroundColor: 'backgroundAction',
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
    backgroundColor: 'white',
    width: '12',
    height: '20',
    borderRadius: '4',
    cursor: 'pointer',
  }),
  {
    top: -6,
  },
])

import { style } from '@vanilla-extract/css'
import { themeVars } from 'nft/css/sprinkles.css'

export const scrollbarStyle = style([
  {
    scrollbarWidth: 'thin',
    scrollbarColor: `${themeVars.colors.backgroundOutline} transparent`,
    height: '100%',
    selectors: {
      '&::-webkit-scrollbar': {
        background: 'transparent',
        width: '4px',
      },
      '&::-webkit-scrollbar-thumb': {
        background: `${themeVars.colors.backgroundOutline}`,
        borderRadius: '8px',
      },
    },
  },
])

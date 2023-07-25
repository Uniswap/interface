import { style } from '@vanilla-extract/css'
import { themeVars } from 'nft/css/sprinkles.css'

export const scrollbarStyle = style([
  {
    scrollbarWidth: 'thin',
    scrollbarColor: `${themeVars.colors.surface3} transparent`,
    height: '100%',
    selectors: {
      '&::-webkit-scrollbar': {
        background: 'transparent',
        width: '4px',
      },
      '&::-webkit-scrollbar-thumb': {
        background: `${themeVars.colors.surface3}`,
        borderRadius: '8px',
      },
    },
  },
])

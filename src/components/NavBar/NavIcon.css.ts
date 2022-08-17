import { style } from '@vanilla-extract/css'

import { sprinkles, themeVars } from '../../nft/css/sprinkles.css'

export const navIcon = style([
  sprinkles({
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    color: 'blackBlue',
    background: 'none',
    border: 'none',
    justifyContent: 'center',
    textAlign: 'center',
    cursor: 'pointer',
    padding: '8',
    borderRadius: '8',
  }),
  {
    ':hover': {
      background: themeVars.colors.lightGrayContainer,
    },
    zIndex: 2,
  },
])

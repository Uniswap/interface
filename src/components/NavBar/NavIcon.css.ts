import { style } from '@vanilla-extract/css'

import { sprinkles, vars } from '../../nft/css/sprinkles.css'

export const navIcon = style([
  sprinkles({
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    border: 'none',
    justifyContent: 'center',
    textAlign: 'center',
    cursor: 'pointer',
    padding: '10',
    borderRadius: '8',
    transition: '250',
  }),
  {
    ':hover': {
      background: vars.color.lightGrayOverlay,
    },
    zIndex: 1,
  },
])

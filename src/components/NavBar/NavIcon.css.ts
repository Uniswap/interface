import { style } from '@vanilla-extract/css'

import { sprinkles, vars } from '../../nft/css/sprinkles.css'

export const navIcon = style([
  sprinkles({
    alignItems: 'center',
    background: 'transparent',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    border: 'none',
    justifyContent: 'center',
    textAlign: 'center',
    cursor: 'pointer',
    borderRadius: '16',
    transition: '250',
  }),
  {
    ':hover': {
      background: vars.color.lightGrayOverlay,
    },
    zIndex: 1,
    transform: `translateY(-1px) translateX(4px)`,
  },
])

import { style } from '@vanilla-extract/css'

import { sprinkles } from '../../nft/css/sprinkles.css'

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
    transition: '250',
  }),
  {
    zIndex: 1,
  },
])

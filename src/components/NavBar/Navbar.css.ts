import { style } from '@vanilla-extract/css'

import { sprinkles } from '../../nft/css/sprinkles.css'

export const nav = style([
  sprinkles({
    paddingX: '20',
    paddingY: '12',
    width: 'full',
    height: '72',
    zIndex: '2',
    borderStyle: 'solid',
  }),
  {
    borderWidth: '0.5px',
    backdropFilter: 'blur(24px)',
  },
])

export const mobileWalletContainer = style([
  sprinkles({
    position: 'fixed',
    display: 'flex',
    bottom: '0',
    right: '1/2',
    marginY: '0',
    marginX: 'auto',
  }),
  {
    transform: 'translate(50%,-50%)',
  },
])

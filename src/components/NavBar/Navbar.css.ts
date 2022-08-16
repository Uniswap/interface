import { style } from '@vanilla-extract/css'

import { sprinkles } from '../../nft/css/sprinkles.css'

export const nav = style([
  sprinkles({
    paddingX: '20',
    paddingY: '12',
    width: 'full',
    height: '72',
    zIndex: '2',
  }),
  {
    backdropFilter: 'blur(24px)',
  },
])

export const baseContainer = style([
  sprinkles({
    display: 'flex',
    alignItems: 'center',
  }),
])

export const baseMobileContainer = style([
  sprinkles({
    display: 'flex',
    width: 'full',
    alignItems: 'center',
    marginY: '2',
  }),
])

export const middleContainer = style([
  baseContainer,
  sprinkles({
    flex: '1',
    flexShrink: '1',
    justifyContent: 'center',
  }),
])

export const rightSideMobileContainer = style([
  baseMobileContainer,
  sprinkles({
    justifyContent: 'flex-end',
  }),
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

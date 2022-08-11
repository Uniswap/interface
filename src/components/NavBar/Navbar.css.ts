import { style } from '@vanilla-extract/css'

import { subhead } from '../../nft/css/common.css'
import { sprinkles } from '../../nft/css/sprinkles.css'

export const nav = style([
  sprinkles({
    background: 'white90',
    paddingX: '20',
    paddingY: '12',
    width: 'full',
    height: '72',
    zIndex: '2',
    borderStyle: 'solid',
  }),
  {
    borderColor: '#00000018',
    borderWidth: '0.5px',
    backdropFilter: 'blur(24px)',
  },
])

export const logoContainer = style([
  sprinkles({
    display: 'flex',
    marginRight: { mobile: '12', desktopXl: '20' },
    alignItems: 'center',
  }),
])

export const logo = style([
  sprinkles({
    display: 'block',
    color: 'blackBlue',
  }),
])

export const baseContainer = style([
  sprinkles({
    display: { mobile: 'none', desktopXl: 'flex' },
    alignItems: 'center',
  }),
])

export const baseMobileContainer = style([
  sprinkles({
    display: { mobile: 'flex', desktopXl: 'none' },
    width: 'full',
    alignItems: 'center',
    marginY: '2',
  }),
])

export const baseSideContainer = style([
  baseContainer,
  sprinkles({
    width: 'full',
    flex: '1',
    flexShrink: '2',
  }),
])

export const leftSideContainer = style([
  baseSideContainer,
  sprinkles({
    justifyContent: 'flex-start',
  }),
])

export const leftSideMobileContainer = style([
  baseMobileContainer,
  sprinkles({
    justifyContent: 'flex-start',
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

export const rightSideContainer = style([
  baseSideContainer,
  sprinkles({
    justifyContent: 'flex-end',
  }),
])

const baseMenuItem = style([
  subhead,
  sprinkles({
    paddingY: '8',
    paddingX: '16',
    marginY: '4',
    borderRadius: '12',
  }),
  {
    lineHeight: '24px',
    textDecoration: 'none',
  },
])

export const menuItem = style([
  baseMenuItem,
  sprinkles({
    color: 'darkGray',
  }),
])

export const rightSideMobileContainer = style([
  baseMobileContainer,
  sprinkles({
    justifyContent: 'flex-end',
  }),
])

export const activeMenuItem = style([
  baseMenuItem,
  sprinkles({
    color: 'blackBlue',
  }),
])

export const mobileWalletContainer = style([
  sprinkles({
    position: 'fixed',
    display: { mobile: 'flex', desktopXl: 'none' },
    bottom: '0',
    right: '1/2',
    marginY: '0',
    marginX: 'auto',
  }),
  {
    transform: 'translate(50%,-50%)',
  },
])

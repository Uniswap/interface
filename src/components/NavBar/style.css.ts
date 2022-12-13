import { style } from '@vanilla-extract/css'

import { subhead } from '../../nft/css/common.css'
import { sprinkles, vars } from '../../nft/css/sprinkles.css'

export const logoContainer = style([
  sprinkles({
    display: 'flex',
    marginRight: { sm: '12', xxl: '20' },
    alignItems: 'center',
    cursor: 'pointer',
  }),
])

export const logo = style([
  sprinkles({
    display: 'block',
    color: 'textPrimary',
  }),
])

export const baseSideContainer = style([
  sprinkles({
    display: 'flex',
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

export const middleContainer = style([
  sprinkles({
    flex: '1',
    flexShrink: '1',
    justifyContent: { lg: 'flex-end', xl: 'center' },
    display: { sm: 'none', xl: 'flex' },
    alignItems: 'flex-start',
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
    transition: '250',
    height: 'min',
    width: 'full',
    textAlign: 'center',
  }),
  {
    lineHeight: '24px',
    textDecoration: 'none',
    ':hover': {
      background: vars.color.lightGrayOverlay,
    },
  },
])

export const menuItem = style([
  baseMenuItem,
  sprinkles({
    color: 'textSecondary',
  }),
])

export const activeMenuItem = style([
  baseMenuItem,
  sprinkles({
    color: 'textPrimary',
    background: 'backgroundFloating',
  }),
])

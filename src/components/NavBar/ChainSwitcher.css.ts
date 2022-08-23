import { style } from '@vanilla-extract/css'

import { sprinkles, vars } from '../../nft/css/sprinkles.css'

export const ChainSwitcher = style([
  sprinkles({
    borderRadius: '8',
    paddingY: '8',
    paddingX: '12',
    cursor: 'pointer',
    border: 'none',
    color: 'blackBlue',
    background: 'none',
    transition: '250',
  }),
  {
    ':hover': {
      background: vars.color.lightGrayOverlay,
    },
  },
])

export const ChainSwitcherRow = style([
  sprinkles({
    border: 'none',
    justifyContent: 'space-between',
    paddingX: '16',
    paddingY: '12',
    cursor: 'pointer',
    color: 'blackBlue',
  }),
  {
    lineHeight: '24px',
    width: '308px',
  },
])

export const Image = style([
  sprinkles({
    width: '28',
    height: '28',
  }),
])

export const Icon = style([
  Image,
  sprinkles({
    marginRight: '12',
  }),
])

export const Indicator = style([
  sprinkles({
    marginLeft: '8',
  }),
])

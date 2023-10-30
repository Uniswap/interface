import { style } from '@vanilla-extract/css'

import { sprinkles, themeVars, vars } from '../../nft/css/sprinkles.css'

export const hover = style([
  sprinkles({
    transition: '250',
    borderRadius: '12',
  }),
  {
    ':hover': {
      background: vars.color.lightGrayOverlay,
    },
  },
])

export const MenuRow = style([
  hover,
  sprinkles({
    color: 'neutral1',
    paddingY: '8',
    paddingX: '8',
    width: 'full',
    whiteSpace: 'nowrap',
  }),
  {
    lineHeight: '24px',
    textDecoration: 'none',
    alignItems: 'flex-start',
  },
])

export const PrimaryText = style([
  {
    lineHeight: '24px',
  },
])

export const SecondaryText = style([
  hover,
  sprinkles({
    paddingY: '8',
    paddingX: '8',
    color: 'neutral2',
    width: 'full',
  }),
  {
    lineHeight: '20px',
  },
])

export const Separator = style([
  sprinkles({
    height: '0',
    marginX: '16',
  }),
  {
    borderTop: 'solid',
    borderColor: themeVars.colors.surface3,
    borderWidth: '1px',
  },
])

export const IconRow = style([
  sprinkles({
    paddingX: '16',
    justifyContent: { sm: 'center', md: 'flex-start' },
  }),
])

import { style } from '@vanilla-extract/css'

import { sprinkles, themeVars } from '../../nft/css/sprinkles.css'

export const MenuRow = style([
  sprinkles({
    color: 'blackBlue',
    paddingY: '12',
    width: 'max',
    marginRight: '52',
  }),
  {
    lineHeight: '24px',
    textDecoration: 'none',
  },
])

export const PrimaryText = style([
  {
    lineHeight: '24px',
  },
])

export const SecondaryText = style([
  sprinkles({
    paddingY: '8',
    color: 'darkGray',
  }),
  {
    lineHeight: '20px',
  },
])

export const Separator = style([
  sprinkles({
    height: '0',
  }),
  {
    borderTop: 'solid',
    borderColor: themeVars.colors.medGray,
    borderWidth: '1px',
  },
])

export const IconRow = style([
  sprinkles({
    paddingX: '16',
    paddingY: '8',
  }),
])

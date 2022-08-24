import { style } from '@vanilla-extract/css'
import { bodySmall, lightGrayOverlayOnHover } from 'nft/css/common.css'

import { sprinkles, themeVars } from '../../nft/css/sprinkles.css'

export const ChainSwitcher = style([
  lightGrayOverlayOnHover,
  sprinkles({
    borderRadius: '8',
    paddingY: '8',
    paddingX: '12',
    cursor: 'pointer',
    border: 'none',
    color: 'blackBlue',
    background: 'none',
  }),
])

export const ChainSwitcherRow = style([
  lightGrayOverlayOnHover,
  sprinkles({
    border: 'none',
    justifyContent: 'space-between',
    paddingX: '16',
    paddingY: '12',
    cursor: 'pointer',
    color: 'blackBlue',
    borderRadius: '12',
  }),
  {
    lineHeight: '24px',
    width: '204px',
  },
])

export const Image = style([
  sprinkles({
    width: '20',
    height: '20',
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

export const Separator = style([
  sprinkles({
    height: '0',
    marginX: '12',
  }),
  {
    borderTop: 'solid',
    borderColor: themeVars.colors.medGray,
    borderWidth: '0.5px',
  },
])

export const ChainInfo = style([
  bodySmall,
  lightGrayOverlayOnHover,
  sprinkles({
    color: 'darkGray',
    cursor: 'pointer',
    paddingX: '12',
    paddingY: '4',
    justifyContent: 'space-between',
    borderRadius: '12',
  }),
])

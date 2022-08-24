import { style } from '@vanilla-extract/css'
import { lightGrayOverlayOnHover } from 'nft/css/common.css'

import { sprinkles } from '../../nft/css/sprinkles.css'

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
    paddingX: '8',
    paddingY: '8',
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

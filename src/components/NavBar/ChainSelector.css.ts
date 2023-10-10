import { style } from '@vanilla-extract/css'
import { lightGrayOverlayOnHover } from 'nft/css/common.css'

import { sprinkles } from '../../nft/css/sprinkles.css'

export const ChainSelector = style([
  lightGrayOverlayOnHover,
  sprinkles({
    borderRadius: '20',
    height: '36',
    cursor: 'pointer',
    border: 'none',
    color: 'neutral1',
    background: 'none',
  }),
])

import { style } from '@vanilla-extract/css'

import { sprinkles } from '../../nft/css/sprinkles.css'

export const NavDropdown = style([
  sprinkles({
    position: 'absolute',
    background: 'lightGray',
    borderRadius: '12',
    borderStyle: 'solid',
    borderColor: 'medGray',
    borderWidth: '1px',
  }),
  {
    boxShadow: '0px 4px 12px 0px #00000026',
    zIndex: 10,
  },
])

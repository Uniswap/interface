import { style } from '@vanilla-extract/css'
import { sprinkles } from 'nft/css/sprinkles.css'

export const bagQuantity = style([
  sprinkles({
    position: 'absolute',
    top: '4',
    right: '4',
    backgroundColor: 'accentAction',
    borderRadius: 'round',
    color: 'explicitWhite',
    textAlign: 'center',
    fontWeight: 'semibold',
    paddingY: '1',
    paddingX: '4',
  }),
  {
    fontSize: '8px',
    lineHeight: '12px',
    minWidth: '14px',
  },
])

import { style } from '@vanilla-extract/css'
import { sprinkles } from 'nft/css/sprinkles.css'

export const rarityInfo = style([
  sprinkles({
    display: 'flex',
    borderRadius: '4',
    height: '16',
    width: 'min',
    color: 'blackBlue',
    background: 'lightGrayButton',
    fontSize: '10',
    fontWeight: 'semibold',
    paddingX: '4',
    cursor: 'pointer',
  }),
  {
    lineHeight: '12px',
    letterSpacing: '0.04em',
    backdropFilter: 'blur(6px)',
  },
])

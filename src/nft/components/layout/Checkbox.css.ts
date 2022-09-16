import { style } from '@vanilla-extract/css'
import { sprinkles } from 'nft/css/sprinkles.css'

export const input = style([
  sprinkles({ position: 'absolute' }),
  {
    top: '-24px',
    selectors: {
      '&[type="checkbox"]': {
        clip: 'rect(0 0 0 0)',
        clipPath: 'inset(50%)',
        height: '1px',
        overflow: 'hidden',
        position: 'absolute',
        whiteSpace: 'nowrap',
        width: '1px',
      },
    },
  },
])

export const checkbox = style([
  sprinkles({
    display: 'inline-block',
    marginRight: '1',
    borderRadius: '4',
    height: '24',
    width: '24',
    borderStyle: 'solid',
    borderWidth: '2px',
  }),
])

export const checkMark = sprinkles({
  display: 'none',
  height: '24',
  width: '24',
  color: 'blue400',
})

export const checkMarkActive = style([
  sprinkles({
    display: 'inline-block',
    color: 'blue400',
    position: 'absolute',
    top: '0',
    right: '1',
  }),
])

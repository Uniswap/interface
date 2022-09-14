import { style } from '@vanilla-extract/css'
import { sprinkles, vars } from 'nft/css/sprinkles.css'

export const input = style({
  position: 'absolute',
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
})

export const checkbox = style([
  {
    borderRadius: '4px',
    height: '24px',
    width: '24px',
    border: `2px solid ${vars.color.grey400}`,
  },
  sprinkles({
    display: 'inline-block',
    marginRight: '1',
  }),
])

export const checkboxActive = style({
  border: `2px solid ${vars.color.blue400}`,
})

export const checkMark = sprinkles({
  display: 'none',
  height: '24',
  width: '24',
  color: 'blue400',
})

export const checkMarkActive = style([
  {
    top: '0px',
    right: '1px',
  },
  sprinkles({
    display: 'inline-block',
    color: 'blue400',
    position: 'absolute',
  }),
])

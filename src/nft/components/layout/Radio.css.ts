import { globalStyle, style } from '@vanilla-extract/css'
import { sprinkles, vars } from 'nft/css/sprinkles.css'

export const container = sprinkles({
  position: 'relative',
  display: 'inline-block',
  height: '24',
  width: '24',
})

export const input = style([
  sprinkles({
    width: '0',
    height: '0',
    opacity: '0',
  }),
])

export const radio = style([
  sprinkles({
    position: 'absolute',
    cursor: 'pointer',
    background: 'transparent',
    borderRadius: { default: 'round', before: 'round' },
    borderStyle: 'solid',
    borderWidth: '2px',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    borderColor: 'grey400',
    transition: {
      default: '250',
      before: '250',
    },
  }),
  {
    ':before': {
      position: 'absolute',
      content: '',
      height: '14px',
      width: '14px',
      visibility: 'hidden',
      top: 3,
      left: 3,
    },
  },
])

export const radioHovered = sprinkles({
  borderColor: 'blue400',
})

globalStyle(`${input}:checked + ${radio}`, {
  borderColor: vars.color.blue400,
})

globalStyle(`${input}:checked + ${radio}:before`, {
  backgroundColor: vars.color.blue400,
  visibility: 'visible',
  left: 3,
  top: 3,
})

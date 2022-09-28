import { style } from '@vanilla-extract/css'
import { sprinkles, vars } from 'nft/css/sprinkles.css'

export const radio = style([
  sprinkles({
    position: 'relative',
    display: 'inline-block',
    height: '24',
    width: '24',
    cursor: 'pointer',
    background: 'transparent',
    borderRadius: { default: 'round', before: 'round' },
    borderStyle: 'solid',
    borderWidth: '2px',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    transition: {
      default: '250',
      before: '250',
    },
  }),
])

export const greyBorderRadio = style([
  radio,
  sprinkles({
    borderColor: 'grey400',
  }),
])

export const blueBorderRadio = style([
  radio,
  sprinkles({
    borderColor: 'blue400',
  }),
])

export const selectedRadio = style([
  blueBorderRadio,
  {
    ':before': {
      position: 'absolute',
      backgroundColor: vars.color.blue400,
      content: '',
      height: '14px',
      width: '14px',
      top: 3,
      left: 3,
    },
  },
])

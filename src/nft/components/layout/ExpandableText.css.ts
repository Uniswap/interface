import { globalStyle, style } from '@vanilla-extract/css'

import { sprinkles } from '../../css/sprinkles.css'

export const hiddenText = style([
  sprinkles({
    overflow: 'hidden',
  }),
  {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    textOverflow: 'ellipsis',
  },
])

export const span = style({})

globalStyle(`${hiddenText} p`, {
  display: 'none',
})

globalStyle(`${hiddenText} p:first-child`, {
  display: 'block',
})

globalStyle(`${span} p:first-child`, {
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  margin: 0,
})

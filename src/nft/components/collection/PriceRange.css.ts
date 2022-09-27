import { style } from '@vanilla-extract/css'

export const slider = style({
  width: 200,
  height: 20,
  backgroundColor: 'black',
  marginTop: 20,
})

export const tracker = style({
  position: 'relative',
  backgroundColor: 'gray',
  height: 10,
  width: 10,
})

export const thumb = style({
  top: '1',
  width: 20,
  height: 20,
  backgroundColor: 'pink',
  // lineHeight: "30"
})

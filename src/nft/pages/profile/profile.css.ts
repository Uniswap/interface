import { style } from '@vanilla-extract/css'
import { sprinkles } from 'nft/css/sprinkles.css'

export const section = style([
  sprinkles({
    paddingLeft: { sm: '16', lg: '0' },
    paddingRight: { sm: '16', lg: '0' },
  }),
  { maxWidth: '1000px', margin: '0 auto' },
])

export const notConnected = style({
  height: '70vh',
})

export const profileWrapper = style([
  sprinkles({
    height: { sm: 'full', md: 'auto' },
    width: 'full',
  }),
  {
    scrollbarWidth: 'none',
  },
])

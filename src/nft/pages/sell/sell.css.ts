import { style } from '@vanilla-extract/css'
import { sprinkles } from 'nft/css/sprinkles.css'

export const NAVBAR_HEIGHT = '72px'

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

export const mobileSellWrapper = style([
  sprinkles({
    position: { sm: 'fixed', md: 'static' },
    top: { sm: '0', md: 'unset' },
    zIndex: { sm: '3', md: 'auto' },
    height: { sm: 'full', md: 'auto' },
    width: 'full',
    overflowY: 'scroll',
  }),
  {
    scrollbarWidth: 'none',
  },
])

export const mobileSellHeader = style([
  sprinkles({
    display: { sm: 'flex', md: 'none' },
    paddingY: '24',
    paddingX: '16',
  }),
  {
    height: NAVBAR_HEIGHT,
  },
])

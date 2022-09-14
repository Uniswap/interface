import { style } from '@vanilla-extract/css'
import { sprinkles, themeVars, vars } from 'nft/css/sprinkles.css'

export const filterButton = sprinkles({
  backgroundColor: 'blue400',
  color: 'explicitWhite',
})

export const filterButtonExpanded = style({
  background: vars.color.lightGray,
  color: themeVars.colors.blackBlue,
})

export const filterBadge = style([
  sprinkles({
    position: 'absolute',
    fontSize: '28',
  }),
  {
    top: '-3px',
    left: '18px',
  },
])

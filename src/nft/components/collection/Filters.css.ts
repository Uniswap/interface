import { style } from '@vanilla-extract/css'
import { breakpoints, sprinkles, themeVars } from 'nft/css/sprinkles.css'

export const container = style([
  sprinkles({
    overflow: 'auto',
    height: 'viewHeight',
    paddingTop: '24',
  }),
  {
    width: '300px',
    paddingBottom: '96px',
    '@media': {
      [`(max-width: ${breakpoints.sm - 1}px)`]: {
        width: 'auto',
        height: 'auto',
        paddingBottom: '0px',
      },
    },
    selectors: {
      '&::-webkit-scrollbar': {
        display: 'none',
      },
    },
  },
])

export const rowHover = style([
  {
    ':hover': {
      background: themeVars.colors.backgroundSurface,
    },
  },
])

export const rowHoverOpen = style([
  {
    ':hover': {
      background: themeVars.colors.backgroundOutline,
    },
  },
])

export const subRowHover = style({
  ':hover': {
    background: themeVars.colors.backgroundOutline,
  },
})

export const detailsOpen = sprinkles({
  overflow: 'hidden',
})

export const filterDropDowns = style([
  sprinkles({
    overflowY: 'scroll',
  }),
  {
    maxHeight: '190px',
    '::-webkit-scrollbar': { display: 'none' },
    scrollbarWidth: 'none',
  },
])

export const borderTop = style({
  borderTop: `1px solid ${themeVars.colors.backgroundOutline}`,
})

export const showBorderBottom = style({
  borderBottom: `1px solid ${themeVars.colors.backgroundOutline}`,
})

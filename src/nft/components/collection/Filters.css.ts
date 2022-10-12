import { style } from '@vanilla-extract/css'
import { breakpoints, sprinkles, themeVars } from 'nft/css/sprinkles.css'

export const container = style([
  sprinkles({
    overflow: 'auto',
    height: 'viewHeight',
    paddingTop: '4',
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
      background: themeVars.colors.backgroundInteractive,
      borderRadius: 12,
    },
  },
])

export const rowHoverOpen = style([
  {
    ':hover': {
      background: themeVars.colors.backgroundInteractive,
    },
  },
])

export const subRowHover = style({
  ':hover': {
    background: themeVars.colors.backgroundInteractive,
  },
})

export const detailsOpen = style([
  sprinkles({
    overflow: 'hidden',
    marginTop: '8',
    marginBottom: '8',
    opacity: '1',
  }),
  {
    borderTop: '1px solid',
    borderColor: themeVars.colors.backgroundOutline,
  },
])

export const detailsClosed = style([
  detailsOpen,
  sprinkles({
    opacity: '0',
  }),
])

export const filterDropDowns = style([
  sprinkles({
    overflowY: 'scroll',
  }),
  {
    maxHeight: '302px',
    '::-webkit-scrollbar': { display: 'none' },
    scrollbarWidth: 'none',
    borderBottom: '1px solid',
    borderColor: themeVars.colors.backgroundOutline,
  },
])

export const borderTop = style({
  borderTop: `1px solid ${themeVars.colors.backgroundOutline}`,
})

export const showBorderBottom = style({
  borderBottom: `1px solid ${themeVars.colors.backgroundOutline}`,
})

export const chevronIcon = style({
  marginLeft: -1,
})

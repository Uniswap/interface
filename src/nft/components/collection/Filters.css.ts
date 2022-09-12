import { style } from '@vanilla-extract/css'
import { sprinkles, themeVars } from 'nft/css/sprinkles.css'

export const container = style([
  sprinkles({
    paddingTop: '24',
    overflow: 'auto',
    maxHeight: 'full',
  }),
  {
    selectors: {
      '&::-webkit-scrollbar': {
        display: 'none',
      },
    },
  },
])

export const rowHover = style({
  borderRadius: '12px',
  ':hover': {
    background: themeVars.colors.lightGray,
  },
})

export const rowHoverOpen = style({
  borderBottomLeftRadius: '0',
  borderBottomRightRadius: '0',
  borderTopLeftRadius: '12px',
  borderTopRightRadius: '12px',
  ':hover': {
    background: themeVars.colors.medGray,
  },
})

export const subRowHover = style({
  ':hover': {
    background: themeVars.colors.medGray,
  },
})

export const detailsOpen = style({
  background: themeVars.colors.darkGray10,
  overflow: 'hidden',
  border: `1px solid ${themeVars.colors.medGray}`,
})

export const summaryOpen = style({
  borderBottom: `1px solid ${themeVars.colors.medGray}`,
})

export const filterDropDowns = style({
  overflowY: 'scroll',
  maxHeight: '190px',
  '::-webkit-scrollbar': { display: 'none' },
  scrollbarWidth: 'none',
})

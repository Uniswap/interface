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

export const rowHover = style([
  sprinkles({
    borderRadius: '12',
  }),
  {
    ':hover': {
      background: themeVars.colors.lightGray,
    },
  },
])

export const rowHoverOpen = style([
  sprinkles({
    borderTopLeftRadius: '12',
    borderTopRightRadius: '12',
    borderBottomLeftRadius: '0',
    borderBottomRightRadius: '0',
  }),
  {
    ':hover': {
      background: themeVars.colors.medGray,
    },
  },
])

export const subRowHover = style({
  ':hover': {
    background: themeVars.colors.medGray,
  },
})

export const detailsOpen = sprinkles({
  background: 'darkGray10',
  overflow: 'hidden',
  borderStyle: 'solid',
  borderWidth: '1px',
  borderColor: 'medGray',
})

export const summaryOpen = sprinkles({
  borderStyle: 'solid',
  borderWidth: '1px',
  borderColor: 'medGray',
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

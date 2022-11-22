import { style } from '@vanilla-extract/css'
import { breakpoints, sprinkles, themeVars } from 'nft/css/sprinkles.css'

export const container = style([
  sprinkles({
    overflow: 'auto',
    height: 'viewHeight',
    paddingTop: '4',
    marginLeft: { sm: '8', md: '48' },
  }),
  {
    width: '308px',
    paddingRight: '8px',
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

export const row = style([
  sprinkles({
    display: 'flex',
    paddingRight: '16',
    cursor: 'pointer',
    fontSize: '16',
    lineHeight: '20',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: '12',
    paddingTop: '10',
    paddingBottom: '10',
  }),
])

export const subRowHover = style({
  ':hover': {
    background: themeVars.colors.backgroundInteractive,
  },
})

export const borderTop = sprinkles({
  borderTopStyle: 'solid',
  borderTopColor: 'backgroundOutline',
  borderTopWidth: '1px',
})

export const borderBottom = sprinkles({
  borderBottomStyle: 'solid',
  borderBottomColor: 'backgroundOutline',
  borderBottomWidth: '1px',
})

export const detailsOpen = style([
  borderTop,
  sprinkles({
    overflow: 'hidden',
    marginTop: '2',
    marginBottom: '2',
  }),
])

export const MAX_FILTER_DROPDOWN_HEIGHT = 302

export const filterDropDowns = style([
  borderBottom,
  sprinkles({
    paddingLeft: '0',
    paddingBottom: '8',
  }),
  {
    maxHeight: `${MAX_FILTER_DROPDOWN_HEIGHT}px`,
    '::-webkit-scrollbar': { display: 'none' },
    scrollbarWidth: 'none',
  },
])

export const chevronIcon = style({
  marginLeft: -1,
})

export const chevronContainer = style([
  sprinkles({
    color: 'textSecondary',
    display: 'inline-block',
    height: '28',
    width: '28',
    transition: '250',
  }),
  {
    marginRight: -1,
  },
])

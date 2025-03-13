import { style } from '@vanilla-extract/css'
import { breakpoints } from 'ui/src/theme'

export const container = style({
  overflow: 'auto',
  height: '100vh',
  paddingTop: '16px',
  width: '308px',
  paddingRight: '8px',
  paddingBottom: '96px',
  marginLeft: '48px',
  '@media': {
    [`(max-width: ${breakpoints.md - 1}px)`]: {
      width: 'auto',
      height: 'auto',
      paddingBottom: '0px',
      marginLeft: '8px',
    },
  },
  selectors: {
    '&::-webkit-scrollbar': {
      display: 'none',
    },
  },
})

export const rowHover = style({
  ':hover': {
    background: 'var(--surface3)',
    borderRadius: '12px',
  },
})

export const row = style({
  display: 'flex',
  paddingRight: '16px',
  cursor: 'pointer',
  fontSize: '16px',
  lineHeight: '20px',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingLeft: '12px',
  paddingTop: '10px',
  paddingBottom: '10px',
})

export const subRowHover = style({
  ':hover': {
    background: 'var(--surface3)',
  },
})

export const borderTop = style({
  borderTopStyle: 'solid',
  borderTopColor: 'var(--surface3)',
  borderTopWidth: '1px',
})

export const borderBottom = style({
  borderBottomStyle: 'solid',
  borderBottomColor: 'var(--surface3)',
  borderBottomWidth: '1px',
})

export const detailsOpen = style([
  borderTop,
  {
    overflow: 'hidden',
    marginTop: '8px',
    marginBottom: '8px',
  },
])

export const MAX_FILTER_DROPDOWN_HEIGHT = 302

export const filterDropDowns = style([
  borderBottom,
  {
    paddingLeft: '0',
    paddingBottom: '8px',
    maxHeight: `${MAX_FILTER_DROPDOWN_HEIGHT}px`,
    '::-webkit-scrollbar': { display: 'none' },
    scrollbarWidth: 'none',
  },
])

export const chevronIcon = style({
  marginLeft: '-1px',
})

export const chevronContainer = style({
  color: 'var(--neutral2)',
  display: 'inline-block',
  height: '28px',
  width: '28px',
  transition: '250ms',
  marginRight: '-1px',
})

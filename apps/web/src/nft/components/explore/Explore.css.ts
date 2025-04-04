import { style } from '@vanilla-extract/css'
import { body, bodySmall } from 'nft/css/common.css'
import { breakpoints } from 'ui/src/theme'

export const section = style({
  paddingLeft: '0',
  paddingRight: '0',
  maxWidth: '1200px',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'nowrap',
  position: 'relative',
  '@media': {
    [`(max-width: ${breakpoints.xl}px)`]: {
      paddingLeft: '16px',
      paddingRight: '16px',
    },
  },
})

/* Activity Feed Styles */
export const activityRow = style({
  position: 'absolute',
  alignItems: 'center',
  transition: 'transform 0.4s ease',
  '@media': {
    [`(max-width: ${breakpoints.lg}px)`]: {
      alignItems: 'flex-start',
    },
  },
})

export const activeRow = style({
  backgroundColor: 'var(--gray800)',
})

export const timestamp = style({
  position: 'absolute',
  fontSize: '12px',
  color: 'var(--gray300)',
  right: '12px',
  '@media': {
    [`(max-width: ${breakpoints.lg}px)`]: {
      right: 'unset',
      left: '64px',
      top: '28px',
    },
  },
})

export const marketplaceIcon = style({
  width: '16px',
  height: '16px',
  borderRadius: '4px',
  flexShrink: 0,
  marginLeft: '8px',
  verticalAlign: 'bottom',
})

/* Base Table Styles  */

export const table = style({
  borderCollapse: 'collapse',
  boxShadow: '0 0 0 1px rgba(153, 161, 189, 0.24)',
  borderSpacing: '0px 40px',
  background: 'var(--surface1)',
  width: '100%',
  borderRadius: '12px',
  borderStyle: 'none',
})

export const thead = style({
  marginRight: '12px',
  borderColor: 'var(--surface3)',
  borderWidth: '1px',
  borderBottomStyle: 'solid',
})

export const th = style([
  bodySmall,
  {
    color: 'var(--neutral2)',
    paddingTop: '12px',
    paddingBottom: '12px',
    selectors: {
      '&:nth-last-child(1)': {
        paddingRight: '20px',
      },
    },
  },
])

export const td = style([
  body,
  {
    maxWidth: '160px',
    paddingTop: '4px',
    paddingBottom: '4px',
    textAlign: 'right',
    position: 'relative',
    selectors: {
      '&:nth-last-child(1)': {
        paddingRight: '20px',
      },
    },
  },
])

export const loadingTd = style([
  body,
  {
    maxWidth: '160px',
    paddingTop: '8px',
    paddingBottom: '8px',
    textAlign: 'right',
    position: 'relative',
    selectors: {
      '&:nth-last-child(1)': {
        paddingRight: '20px',
      },
    },
  },
])

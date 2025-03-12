import { style } from '@vanilla-extract/css'
import { body, bodySmall, buttonTextMedium, subhead, subheadSmall } from 'nft/css/common.css'
import { breakpoints } from 'ui/src/theme'

export const baseRow = style({
  display: 'grid',
  gridTemplateColumns: '2.5fr 1fr',
  '@media': {
    [`screen and (min-width: ${breakpoints.md}px)`]: {
      gridTemplateColumns: '2fr 1.5fr 1fr',
    },
    [`screen and (min-width: ${breakpoints.lg}px)`]: {
      gridTemplateColumns: '1.75fr 1.4fr 1.1fr 1fr 1fr',
    },
    [`screen and (min-width: ${breakpoints.xl}px)`]: {
      gridTemplateColumns: '1.75fr 1.4fr 1.1fr 1fr 1fr',
    },
    [`screen and (min-width: ${breakpoints.xxl}px)`]: {
      gridTemplateColumns: '1.75fr 1.4fr 1.1fr 1fr 1fr 1fr',
    },
  },
})

export const eventRow = style([
  baseRow,
  {
    paddingTop: '12px',
    paddingBottom: '12px',
    paddingLeft: '4px',
    paddingRight: '4px',
    color: 'var(--neutral1)',
    cursor: 'pointer',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderBottomColor: 'var(--surface3)',
    textDecoration: 'none',
    height: '84px',
    '@media': {
      [`screen and (min-width: ${breakpoints.lg}px)`]: {
        paddingLeft: '16px',
        paddingRight: '16px',
      },
    },
    ':hover': {
      background: 'var(--surface1)',
    },
  },
])

export const headerRow = style([
  baseRow,
  {
    paddingBottom: '8px',
    color: 'var(--neutral2)',
    fontSize: '12px',
    fontWeight: '500',
    paddingLeft: '16px',
    paddingRight: '16px',
    lineHeight: '16px',
  },
])

export const detailsImage = style({
  width: '60px',
  height: '60px',
  borderRadius: '8px',
})

export const detailsName = style([
  body,
  {
    marginBottom: '6px',
    fontWeight: '400',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
])

export const eventDetail = style([
  subhead,
  {
    gap: '8px',
    lineHeight: '24px',
  },
])

export const eventTime = style([
  bodySmall,
  {
    color: 'var(--neutral2)',
    lineHeight: '20px',
  },
])

export const addressCell = style([
  buttonTextMedium,
  {
    color: 'var(--neutral1)',
    height: '100%',
    justifyContent: 'center',
    paddingLeft: '2px',
    lineHeight: '24px',
  },
])

export const baseBuyCell = style([
  buttonTextMedium,
  {
    width: 'max-content',
    background: 'none',
    paddingTop: '12px',
    paddingBottom: '12px',
    paddingLeft: '16px',
    paddingRight: '16px',
    border: 'none',
    borderRadius: '12px',
    transition: '250ms',
    lineHeight: '20px',
  },
])

export const buyCell = style([
  baseBuyCell,
  {
    selectors: {
      '&:enabled': {
        cursor: 'pointer',
        color: 'var(--accent1)',
      },
      '&:disabled': {
        color: 'var(--neutral3)',
      },
      '&:hover&:enabled': {
        background: 'var(--accent1)',
        color: 'var(--white)',
      },
    },
  },
])

export const removeCell = style([
  baseBuyCell,
  {
    color: 'var(--critical)',
    cursor: 'pointer',
    ':hover': {
      background: 'var(--critical)',
      color: 'var(--white)',
    },
  },
])

export const filter = style([
  subheadSmall,
  {
    background: 'var(--surface3)',
    color: 'var(--neutral1)',
    paddingTop: '12px',
    paddingBottom: '12px',
    paddingLeft: '16px',
    paddingRight: '16px',
    borderRadius: '12px',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
])

export const rarityInfo = style({
  display: 'flex',
  borderRadius: '4px',
  height: '16px',
  width: 'min-content',
  color: 'var(--neutral1)',
  background: 'var(--surface3)',
  fontSize: '10px',
  fontWeight: '500',
  paddingLeft: '4px',
  paddingRight: '4px',
  cursor: 'pointer',
  lineHeight: '12px',
  letterSpacing: '0.04em',
  backdropFilter: 'blur(6px)',
})

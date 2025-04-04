import { style } from '@vanilla-extract/css'

export const center = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
})

// TYPOGRAPHY
export const headlineMedium = style({
  fontWeight: '500',
  fontSize: '28px',
  lineHeight: '36px',
})

export const headlineSmall = style({
  fontWeight: '500',
  fontSize: '20px',
  lineHeight: '28px',
})

export const subhead = style({
  fontWeight: '400',
  fontSize: '16px',
  lineHeight: '24px',
})

export const subheadSmall = style({
  fontWeight: '400',
  fontSize: '14px',
  lineHeight: '14px',
})

export const body = style({
  fontWeight: '400',
  fontSize: '16px',
  lineHeight: '24px',
})

export const bodySmall = style({
  fontWeight: '400',
  fontSize: '14px',
  lineHeight: '20px',
})

export const buttonTextMedium = style({
  fontWeight: '500',
  fontSize: '16px',
  lineHeight: '20px',
})

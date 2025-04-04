import { style } from '@vanilla-extract/css'
import { center, subhead } from 'nft/css/common.css'

export const image = style({
  borderRadius: '20px',
  height: '100%',
  alignSelf: 'center',
  maxHeight: 'calc(90vh - 165px)',
  minHeight: '400px',
  maxWidth: '780px',
  boxShadow: `0px 20px 50px var(--shadow), 0px 10px 50px rgba(70, 115, 250, 0.2)`,
  '@media': {
    '(max-width: 1024px)': {
      maxHeight: '64vh',
    },
    '(max-width: 640px)': {
      minHeight: '280px',
      maxHeight: '56vh',
      maxWidth: '100%',
    },
  },
})

export const embedContainer = style({
  position: 'relative',
  overflow: 'hidden',
  width: '100%',
  paddingTop: '100%',
})

export const embed = style([
  image,
  {
    position: 'absolute',
    top: '0',
    left: '0',
    bottom: '0',
    right: '0',
    width: '100%',
    height: '100%',
  },
])

export const container = style([
  center,
  {
    minHeight: 'calc(100vh - 97px)',
  },
])

export const marketplace = style({
  borderRadius: '4px',
})

export const tab = style([
  subhead,
  {
    color: 'var(--neutral2)',
    border: 'none',
    padding: '0',
    background: 'transparent',
    cursor: 'pointer',
    selectors: {
      '&[data-active="true"]': {
        textDecoration: 'underline',
        textDecorationColor: 'var(--accent1)',
        textUnderlineOffset: '8px',
        textDecorationThickness: '2px',
        color: 'var(--neutral1)',
      },
    },
  },
])

export const creator = style({
  '@media': {
    '(max-width: 640px)': {
      display: 'none',
    },
  },
})

export const columns = style({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
  width: '100%',
  paddingLeft: '52px',
  paddingRight: '52px',
  paddingBottom: '52px',
  paddingTop: '16px',
  gap: '52px',
  boxSizing: 'border-box',
  '@media': {
    '(max-width: 1024px)': {
      flexDirection: 'column',
      alignItems: 'center',
    },
    '(max-width: 960px)': {
      paddingLeft: '24px',
      paddingRight: '24px',
      paddingBottom: '24px',
      gap: '28px',
    },
    '(max-width: 640px)': {
      paddingLeft: '16px',
      paddingRight: '16px',
      paddingBottom: '16px',
      gap: '32px',
    },
  },
})

export const column = style({
  alignSelf: 'center',
  '@media': {
    '(max-width: 1024px)': {
      maxWidth: 'calc(88%)',
      width: 'calc(88%)',
    },
  },
})

export const columnRight = style({
  maxHeight: 'calc(100vh - 165px)',
  overflow: 'scroll',
  '@media': {
    '(max-width: 1024px)': {
      maxHeight: '100%',
    },
  },
  selectors: {
    '&::-webkit-scrollbar': {
      display: 'none',
    },
  },
  scrollbarWidth: 'none',
})

export const audioControls = style({
  position: 'absolute',
  left: '0',
  right: '0',
  textAlign: 'center',
  marginRight: 'auto',
  marginLeft: 'auto',
  bottom: 'calc(10%)',
})

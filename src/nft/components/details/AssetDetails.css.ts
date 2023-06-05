import { style } from '@vanilla-extract/css'

import { center, subhead } from '../../css/common.css'
import { sprinkles, vars } from '../../css/sprinkles.css'

export const image = style([
  sprinkles({ borderRadius: '20', height: 'full', alignSelf: 'center' }),
  {
    maxHeight: 'calc(90vh - 165px)',
    minHeight: 400,
    maxWidth: 780,
    boxShadow: `0px 20px 50px var(--shadow), 0px 10px 50px rgba(70, 115, 250, 0.2)`,
    '@media': {
      '(max-width: 1024px)': {
        maxHeight: '64vh',
      },
      '(max-width: 640px)': {
        minHeight: 280,
        maxHeight: '56vh',
        maxWidth: '100%',
      },
    },
  },
])

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
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
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

export const marketplace = sprinkles({ borderRadius: '4' })

export const tab = style([
  subhead,
  sprinkles({ color: 'textSecondary', border: 'none', padding: '0', background: 'transparent', cursor: 'pointer' }),
  {
    selectors: {
      '&[data-active="true"]': {
        textDecoration: 'underline',
        textDecorationColor: vars.color.accentAction,
        textUnderlineOffset: '8px',
        textDecorationThickness: '2px',
        color: vars.color.textPrimary,
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

export const columns = style([
  sprinkles({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    width: 'full',
    paddingLeft: { sm: '16', lg: '24', xl: '52' },
    paddingRight: { sm: '16', lg: '24', xl: '52' },
    paddingBottom: { sm: '16', lg: '24', xl: '52' },
    paddingTop: '16',
    gap: { sm: '32', lg: '28', xl: '52' },
  }),
  {
    boxSizing: 'border-box',
    '@media': {
      '(max-width: 1024px)': {
        flexDirection: 'column',
        alignItems: 'center',
      },
    },
  },
])

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

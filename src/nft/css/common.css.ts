import { style } from '@vanilla-extract/css'

import { sprinkles, themeVars } from './sprinkles.css'

export const center = sprinkles({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
})

export const row = sprinkles({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
})

export const column = sprinkles({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
})

export const section = style([
  sprinkles({
    paddingLeft: { mobile: '16', desktopL: '0' },
    paddingRight: { mobile: '16', desktopL: '0' },
  }),
  { maxWidth: '1000px', margin: '0 auto' },
])

// TYPOGRAPHY
export const header1 = sprinkles({ fontWeight: 'normal', fontSize: '36' })
export const header2 = sprinkles({ fontWeight: 'normal', fontSize: '28' })
export const headlineSmall = sprinkles({ fontWeight: 'normal', fontSize: '20' })
export const subhead = sprinkles({ fontWeight: 'medium', fontSize: '16' })
export const subheadSmall = sprinkles({ fontWeight: 'medium', fontSize: '14' })
export const body = sprinkles({ fontSize: '16' })
export const bodySmall = sprinkles({
  fontSize: '14',
})
export const caption = sprinkles({ fontWeight: 'bold', fontSize: '12' })
export const badge = style([sprinkles({ fontWeight: 'semibold', fontSize: '10' }), { letterSpacing: '0.5px' }])
export const buttonTextLarge = sprinkles({ fontWeight: 'medium', fontSize: '28' })

export const buttonTextMedium = sprinkles({ fontWeight: 'medium', fontSize: '16' })
export const buttonMedium = style([
  buttonTextMedium,
  sprinkles({
    backgroundColor: 'blue',
    borderRadius: '12',
    color: 'explicitWhite',
    transition: '250',
    boxShadow: { hover: 'elevation' },
  }),
  {
    cursor: 'pointer',
    padding: '14px 18px',
    border: 'none',
    ':hover': {
      cursor: 'pointer',
    },
    ':disabled': {
      cursor: 'auto',
      opacity: '0.3',
    },
  },
])

export const buttonReset = sprinkles({
  border: 'none',
  background: 'none',
  cursor: 'pointer',
})

export const disabled = style([
  {
    padding: '19px 17px',
    boxSizing: 'border-box',
    textAlign: 'left',
  },
  sprinkles({
    color: 'placeholder',
    fontWeight: 'medium',
    background: 'whitesmoke',
    borderRadius: '14',
    borderStyle: 'none',
    width: 'full',
    fontSize: '16',
  }),
])

export const buttonTextSmall = sprinkles({ fontWeight: 'normal', fontSize: '14' })
export const buttonSmall = style([
  buttonTextSmall,
  sprinkles({
    background: 'lightGray',
    borderRadius: '12',
    fontSize: '12',
    color: 'genieBlue',
    transition: '250',
    boxShadow: { hover: 'elevation' },
  }),
  {
    padding: '2px 8px',
    border: 'none',
    ':hover': {
      cursor: 'pointer',
    },
    ':disabled': {
      cursor: 'auto',
      color: themeVars.colors.white,
      backgroundColor: themeVars.colors.medGray,
    },
  },
])

export const imageHover = style({
  transform: 'scale(1.25)',
})

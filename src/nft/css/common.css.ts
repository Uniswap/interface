import { style } from '@vanilla-extract/css'

import { sprinkles, themeVars, vars } from './sprinkles.css'

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
    color: 'textTertiary',
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
    background: 'backgroundSurface',
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
      color: themeVars.colors.backgroundSurface,
      backgroundColor: themeVars.colors.backgroundOutline,
    },
  },
])

export const imageHover = style({
  transform: 'scale(1.25)',
})

export const magicalGradient = style({
  selectors: {
    '&::before': {
      content: '',
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(91.46deg, #4673FA 0%, #9646FA 100.13%) border-box',
      borderColor: 'transparent',
      WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);',
      WebkitMaskComposite: 'xor;',
      maskComposite: 'exclude',
      borderStyle: 'solid',
      borderWidth: '1px',
      borderRadius: 'inherit',
      pointerEvents: 'none',
    },
  },
})

export const magicalGradientOnHover = style([
  magicalGradient,
  {
    selectors: {
      '&::before': {
        opacity: '0',
        WebkitTransition: 'opacity 0.25s ease',
        MozTransition: 'opacity 0.25s ease',
        msTransition: 'opacity 0.25s ease',
        transition: 'opacity 0.25s ease-out',
      },
      '&:hover::before': {
        opacity: '1',
      },
    },
  },
])

export const lightGrayOverlayOnHover = style([
  sprinkles({
    transition: '250',
  }),
  {
    ':hover': {
      background: vars.color.lightGrayOverlay,
    },
  },
])

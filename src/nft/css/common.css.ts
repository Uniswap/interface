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
export const headlineLarge = sprinkles({ fontWeight: 'normal', fontSize: '36', lineHeight: '44' })
export const headlineMedium = sprinkles({ fontWeight: 'normal', fontSize: '28', lineHeight: '36' })
export const headlineSmall = sprinkles({ fontWeight: 'normal', fontSize: '20', lineHeight: '28' })

export const subhead = sprinkles({ fontWeight: 'medium', fontSize: '16', lineHeight: '24' })
export const subheadSmall = sprinkles({ fontWeight: 'medium', fontSize: '14', lineHeight: '14' })

export const body = sprinkles({ fontWeight: 'normal', fontSize: '16', lineHeight: '24' })
export const bodySmall = sprinkles({ fontWeight: 'normal', fontSize: '14', lineHeight: '20' })
export const caption = sprinkles({ fontWeight: 'normal', fontSize: '12', lineHeight: '16' })
export const badge = sprinkles({ fontWeight: 'semibold', fontSize: '10', lineHeight: '12' })

export const buttonTextLarge = sprinkles({ fontWeight: 'semibold', fontSize: '20', lineHeight: '24' })
export const buttonTextMedium = sprinkles({ fontWeight: 'semibold', fontSize: '16', lineHeight: '20' })
export const buttonTextSmall = sprinkles({ fontWeight: 'semibold', fontSize: '14', lineHeight: '16' })

export const commonButtonStyles = style([
  sprinkles({
    borderRadius: '12',
    transition: '250',
    boxShadow: { hover: 'elevation' },
  }),
  {
    border: 'none',
    ':hover': {
      cursor: 'pointer',
    },
    ':disabled': {
      cursor: 'auto',
    },
  },
])

export const buttonMedium = style([
  buttonTextMedium,
  commonButtonStyles,
  sprinkles({
    backgroundColor: 'blue',
    color: 'explicitWhite',
  }),
  {
    padding: '14px 18px',
    ':disabled': {
      opacity: '0.3',
    },
  },
])

export const buttonSmall = style([
  buttonTextSmall,
  commonButtonStyles,
  sprinkles({
    background: 'backgroundSurface',
    color: 'genieBlue',
  }),
  {
    padding: '2px 8px',
    ':disabled': {
      color: themeVars.colors.backgroundSurface,
      backgroundColor: themeVars.colors.backgroundOutline,
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

import { style } from '@vanilla-extract/css'

import { sprinkles, vars } from './sprinkles.css'

export const center = sprinkles({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
})

// TYPOGRAPHY
export const headlineMedium = sprinkles({ fontWeight: 'semibold', fontSize: '28', lineHeight: '36' })
export const headlineSmall = sprinkles({ fontWeight: 'semibold', fontSize: '20', lineHeight: '28' })

export const subhead = sprinkles({ fontWeight: 'medium', fontSize: '16', lineHeight: '24' })
export const subheadSmall = sprinkles({ fontWeight: 'medium', fontSize: '14', lineHeight: '14' })

export const body = sprinkles({ fontWeight: 'normal', fontSize: '16', lineHeight: '24' })
export const bodySmall = sprinkles({ fontWeight: 'normal', fontSize: '14', lineHeight: '20' })
export const caption = sprinkles({ fontWeight: 'normal', fontSize: '12', lineHeight: '16' })

export const buttonTextMedium = sprinkles({ fontWeight: 'semibold', fontSize: '16', lineHeight: '20' })
export const buttonTextSmall = sprinkles({ fontWeight: 'semibold', fontSize: '14', lineHeight: '16' })

const magicalGradient = style({
  selectors: {
    '&::before': {
      content: '',
      position: 'absolute',
      inset: '-1px',
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

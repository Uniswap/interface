import { style } from '@vanilla-extract/css'

import { sprinkles, vars } from './sprinkles.css'

export const center = sprinkles({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
})

// TYPOGRAPHY
export const headlineMedium = sprinkles({ fontWeight: 'medium', fontSize: '28', lineHeight: '36' })
export const headlineSmall = sprinkles({ fontWeight: 'medium', fontSize: '20', lineHeight: '28' })

export const subhead = sprinkles({ fontWeight: 'book', fontSize: '16', lineHeight: '24' })
export const subheadSmall = sprinkles({ fontWeight: 'book', fontSize: '14', lineHeight: '14' })

export const body = sprinkles({ fontWeight: 'book', fontSize: '16', lineHeight: '24' })
export const bodySmall = sprinkles({ fontWeight: 'book', fontSize: '14', lineHeight: '20' })
export const caption = sprinkles({ fontWeight: 'book', fontSize: '12', lineHeight: '16' })

export const buttonTextMedium = sprinkles({ fontWeight: 'medium', fontSize: '16', lineHeight: '20' })
export const buttonTextSmall = sprinkles({ fontWeight: 'medium', fontSize: '14', lineHeight: '16' })

const magicalGradient = style({
  selectors: {
    '&::before': {
      content: '',
      position: 'absolute',
      inset: '-1px',
      background: 'linear-gradient(45deg, #FC72FF80 0%, #FC72FF80 100.13%) border-box',
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

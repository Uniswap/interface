import { keyframes, style } from '@vanilla-extract/css'
import { darken } from 'polished'

export const loadingAnimation = keyframes({
  '0%': {
    backgroundPosition: '100% 50%',
  },
  '100%': {
    backgroundPosition: '0% 50%',
  },
})

export const loadingBlock = style([
  {
    animation: `${loadingAnimation} 1.5s infinite`,
    animationFillMode: 'both',
    background: `linear-gradient(to left, #7C85A24D 25%, ${darken(0.8, '#7C85A24D')} 50%, #7C85A24D 75%)`,
    backgroundSize: '400%',
    willChange: 'background-position',
  },
])

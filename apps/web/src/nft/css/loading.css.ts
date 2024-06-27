import { keyframes, style } from '@vanilla-extract/css'

import { sprinkles, vars } from './sprinkles.css'

const loadingAnimation = keyframes({
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
    background: `linear-gradient(to left, ${vars.color.surface1} 25%, ${vars.color.surface3} 50%, ${vars.color.surface1} 75%)`,
    backgroundSize: '400%',
    willChange: 'background-position',
  },
])

export const loadingAsset = style([
  loadingBlock,
  sprinkles({
    borderRadius: '12',
    cursor: 'default',
    color: 'transparent',
  }),
  {
    userSelect: 'none',
  },
])

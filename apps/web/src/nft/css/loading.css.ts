import { keyframes, style } from '@vanilla-extract/css'

const loadingAnimation = keyframes({
  '0%': {
    backgroundPosition: '100% 50%',
  },
  '100%': {
    backgroundPosition: '0% 50%',
  },
})

export const loadingBlock = style({
  animation: `${loadingAnimation} 1.5s infinite`,
  animationFillMode: 'both',
  background: `linear-gradient(to left, var(--surface1) 25%, var(--surface3) 50%, var(--surface1) 75%)`,
  backgroundSize: '400%',
  willChange: 'background-position',
})

export const loadingAsset = style([
  loadingBlock,
  {
    borderRadius: '12px',
    cursor: 'default',
    color: 'transparent',
    userSelect: 'none',
  },
])

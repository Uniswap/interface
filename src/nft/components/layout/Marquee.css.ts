import { globalKeyframes, style } from '@vanilla-extract/css'

import { sprinkles } from '../../css/sprinkles.css'

globalKeyframes('scroll', {
  '0%': {
    transform: 'translateX(0%)',
  },
  '100%': {
    transform: 'translateX(-100%)',
  },
})

export const marquee = style([
  sprinkles({
    minWidth: 'full',
    zIndex: '1',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  }),
  {
    flex: '0 0 auto',
    animation: 'scroll var(--duration) linear infinite',
  },
])

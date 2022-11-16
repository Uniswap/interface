import { style } from '@vanilla-extract/css'

import { sprinkles } from '../../css/sprinkles.css'

export const buy = style([
  {
    top: '-32px',
    left: '50%',
    transform: 'translateX(-50%)',
  },
  sprinkles({ color: 'backgroundSurface', position: 'absolute', borderRadius: 'round' }),
])

export const quantity = style([
  {
    padding: '9px 4px 8px',
  },
  sprinkles({
    position: 'relative',
  }),
])

export const details = style({ float: 'right' })

export const marketplace = style({
  position: 'absolute',
  left: '0',
  bottom: '12px',
})

export const ethIcon = style({ display: 'inline-block', marginBottom: '-3px', overflow: 'auto' })

export const rarityInfo = style({
  background: 'rgba(255, 255, 255, 0.6)',
  backdropFilter: 'blur(6px)',
})

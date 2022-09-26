import { style } from '@vanilla-extract/css'

import { sprinkles, vars } from '../../css/sprinkles.css'

export const assetInnerStyle = style([
  sprinkles({
    borderRadius: '20',

    position: 'relative',
    cursor: 'pointer',
  }),
  {
    border: `4px solid ${vars.color.backgroundSurface}`,
  },
])

export const hoverAsset = style({
  border: `4px solid ${vars.color.genieBlue}`,
  boxShadow: '0 4px 16px rgba(70,115,250,0.4)',
})

export const assetSelected = style([
  sprinkles({
    borderRadius: '20',
  }),
  {
    border: `4px solid ${vars.color.genieBlue}`,
  },
])

export const buy = style([
  {
    top: '-32px',
    left: '50%',
    transform: 'translateX(-50%)',
  },
  sprinkles({ color: 'backgroundSurface', position: 'absolute', borderRadius: 'round' }),
])

export const tokenQuantityHovered = style([
  {
    border: `4px solid ${vars.color.backgroundSurface}`,
    display: 'flex',
    justifyContent: 'space-between',
  },
  sprinkles({
    backgroundColor: 'genieBlue',
    borderRadius: 'round',
  }),
])

export const tokenQuantity = style([
  {
    padding: '10px 17px',
    border: `4px solid ${vars.color.backgroundSurface}`,
  },
  sprinkles({
    color: 'genieBlue',
    backgroundColor: 'backgroundSurface',
    borderRadius: 'round',
    textAlign: 'center',
  }),
])

export const plusIcon = style([
  {
    padding: '10px',
    border: `4px solid ${vars.color.backgroundSurface}`,
  },
  sprinkles({
    width: '28',
    backgroundColor: 'genieBlue',
    borderRadius: 'round',
  }),
])

export const bagIcon = style([
  {
    width: '42px',
    padding: '9px',
  },
  sprinkles({
    borderRadius: 'round',
    backgroundColor: 'backgroundSurface',
  }),
])

export const minusIcon = style([
  {
    width: '11px',
    padding: '19px 14px 8px 16px',
  },
  sprinkles({
    position: 'relative',
  }),
])

export const plusQuantityIcon = style([
  {
    width: '12px',
    padding: '11px 16px 8px 12px',
  },
  sprinkles({
    position: 'relative',
  }),
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

export const placeholderImage = style({ width: '50%', padding: '25%' })
export const ethIcon = style({ display: 'inline-block', marginBottom: '-3px', overflow: 'auto' })

export const rarityInfo = style({
  background: 'rgba(255, 255, 255, 0.6)',
  backdropFilter: 'blur(6px)',
})

export const iconToolTip = style([
  sprinkles({
    display: 'inline-block',
    overflow: 'auto',
    marginRight: '4',
  }),
  {
    marginBottom: '-3px',
  },
])

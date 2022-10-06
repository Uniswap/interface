import { style } from '@vanilla-extract/css'
import { buttonTextSmall } from 'nft/css/common.css'
import { sprinkles } from 'nft/css/sprinkles.css'

export const tagAssetImage = style([
  sprinkles({
    borderRadius: '8',
    height: '56',
    width: '56',
    marginX: '12',
  }),
])

export const removeAsset = style([
  sprinkles({
    position: 'absolute',
    cursor: 'pointer',
  }),
  {
    bottom: '-4px',
    left: '24px',
  },
])

export const removeIcon = style([
  sprinkles({
    width: '32',
  }),
])

export const removeBagRowButton = style([
  buttonTextSmall,
  sprinkles({
    background: 'backgroundInteractive',
    color: 'textPrimary',
    paddingX: '14',
    paddingY: '12',
    borderRadius: '12',
    cursor: 'pointer',
  }),
])

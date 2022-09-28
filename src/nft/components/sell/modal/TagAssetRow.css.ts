import { style } from '@vanilla-extract/css'
import { sprinkles } from 'nft/css/sprinkles.css'

export const tagAssetImage = style([
  sprinkles({
    borderRadius: '8',
    height: '52',
    width: '52',
    marginRight: '12',
    marginLeft: '8',
    cursor: 'pointer',
  }),
  {
    boxSizing: 'border-box',
  },
])

export const tagAssetName = style([
  sprinkles({
    fontWeight: 'medium',
    overflow: 'hidden',
    marginRight: 'auto',
    marginTop: '4',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
])

export const tagAssetCollectionName = style([
  sprinkles({
    fontWeight: 'normal',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  {
    maxWidth: '65%',
  },
])

export const tagAssetRowBottom = style([
  sprinkles({
    width: 'full',
    display: 'flex',
    flexWrap: 'nowrap',
    marginRight: '4',
  }),
  {
    marginTop: '-10px',
  },
])

export const removeAsset = style([
  sprinkles({
    position: 'absolute',
    cursor: 'pointer',
  }),
  {
    bottom: '-12px',
    left: '22px',
  },
])

export const removeIcon = style([
  sprinkles({
    width: '32',
  }),
])

export const tagAssetInfo = style([
  sprinkles({
    fontSize: '14',
    color: 'textPrimary',
    display: 'flex',
    flexWrap: 'wrap',
    width: 'full',
    overflowX: 'hidden',
  }),
  {
    lineHeight: '17px',
  },
])

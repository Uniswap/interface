import { style } from '@vanilla-extract/css'
import { sprinkles } from 'nft/css/sprinkles.css'

export const cartAssetImage = style([
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

export const cartAssetName = style([
  sprinkles({
    fontWeight: 'medium',
    overflow: 'hidden',
    marginRight: 'auto',
  }),
  {
    marginTop: '4px',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
])

export const cartAssetCollectionName = style([
  sprinkles({
    fontWeight: 'normal',
    overflow: 'hidden',
  }),
  {
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '65%',
  },
])

export const cartAssetRowBottom = style([
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

export const removeAsset = style({
  position: 'absolute',
  bottom: '-12px',
  left: '22px',
  cursor: 'pointer',
  visibility: 'hidden',
})

export const assetHovered = style({
  visibility: 'visible',
})

export const verifiedBadge = style({
  height: '12px',
  width: '12px',
  marginLeft: '2px',
  boxSizing: 'border-box',
})

export const removeIcon = style({
  width: '32px',
})

export const ethIcon = style({
  display: 'inline-block',
  marginBottom: '-3px',
  overflow: 'auto',
  marginLeft: '-2px',
})

export const toolTipIcon = style([
  sprinkles({
    marginTop: '4',
  }),
])

// Borrowed

export const ethPrice = style([
  sprinkles({
    fontWeight: 'medium',
    marginRight: '4',
    marginTop: '2',
  }),
])

export const cartAssetInfo = style([
  sprinkles({
    fontSize: '14',
    color: 'blackBlue',
    display: 'flex',
    flexWrap: 'wrap',
    width: 'full',
    overflowX: 'hidden',
  }),
  {
    lineHeight: '17px',
  },
])

export const usdPrice = style([
  sprinkles({
    fontWeight: 'normal',
    fontSize: '12',
    color: 'darkGray',
    marginLeft: 'auto',
  }),
  {
    lineHeight: '15px',
  },
])

export const toolTip = style([
  sprinkles({
    display: 'inline-block',
    color: 'darkGray',
  }),
])

export const poolIcon = style([
  sprinkles({
    marginRight: '2',
    overflow: 'auto',
  }),
  {
    marginBottom: '-2px',
  },
])

export const susIcon = style([
  sprinkles({
    marginRight: '2',
    overflow: 'auto',
  }),
  {
    marginBottom: '-8px',
  },
])

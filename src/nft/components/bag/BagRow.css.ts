import { style } from '@vanilla-extract/css'
import { bodySmall } from 'nft/css/common.css'
import { sprinkles, themeVars } from 'nft/css/sprinkles.css'

export const bagRow = style([
  sprinkles({
    color: 'textPrimary',
    paddingX: '12',
    paddingY: '8',
    gap: '12',
    cursor: 'pointer',
    height: 'full',
    borderRadius: '12',
  }),
  {
    marginLeft: '-4px',
    marginRight: '-4px',
    ':hover': {
      background: themeVars.colors.stateOverlayHover,
    },
  },
])

export const unavailableAssetsContainer = sprinkles({
  background: 'none',
  gap: '12',
  color: 'textPrimary',
  paddingY: '16',
  marginX: '8',
  borderStyle: 'solid',
  borderWidth: '1px',
  borderColor: 'transparent',
  borderTopColor: 'backgroundOutline',
  borderBottomColor: 'backgroundOutline',
  height: 'full',
})

export const priceChangeColumn = sprinkles({
  background: 'none',
  gap: '8',
  color: 'textPrimary',
  paddingY: '16',
  marginX: '8',
  borderStyle: 'solid',
  borderWidth: '1px',
  borderColor: 'transparent',
  borderBottomColor: 'backgroundOutline',
  height: 'full',
  cursor: 'pointer',
})

export const priceChangeRow = style([
  bodySmall,
  sprinkles({
    color: 'gold',
    gap: '4',
  }),
])

export const bagRowImage = sprinkles({
  width: '56',
  height: '56',
  objectFit: 'cover',
  borderRadius: '8',
})

export const grayscaleImage = style({
  filter: 'grayscale(100%)',
})

export const bagRowPrice = style([
  sprinkles({
    gap: '4',
    fontSize: '16',
    fontWeight: 'semibold',
    flexShrink: '0',
  }),
  {
    lineHeight: '24px',
  },
])

export const assetName = style([
  sprinkles({
    fontSize: '16',
    fontWeight: 'medium',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  {
    lineHeight: '24px',
  },
])

export const collectionName = style([
  bodySmall,
  sprinkles({
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    color: 'textSecondary',
  }),
])

export const icon = sprinkles({
  flexShrink: '0',
})

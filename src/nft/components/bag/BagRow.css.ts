import { style } from '@vanilla-extract/css'
import { bodySmall, buttonTextSmall } from 'nft/css/common.css'
import { sprinkles, themeVars, vars } from 'nft/css/sprinkles.css'

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
      background: themeVars.colors.backgroundModule,
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

export const unavailableAssetRow = style([
  sprinkles({
    gap: '12',
    color: 'textPrimary',
    paddingX: '12',
    paddingY: '4',
  }),
  {
    ':hover': {
      background: themeVars.colors.backgroundInteractive,
    },
  },
])

export const priceChangeButton = style([
  bodySmall,
  sprinkles({
    width: 'full',
    paddingY: '8',
    color: 'explicitWhite',
    fontWeight: 'semibold',
    textAlign: 'center',
    borderRadius: '12',
  }),
  {
    ':hover': {
      color: themeVars.colors.textTertiary,
    },
  },
])

export const keepButton = style([
  priceChangeButton,
  sprinkles({
    backgroundColor: 'blue400',
  }),
  {
    ':hover': {
      background: `linear-gradient(rgba(76, 130, 251, 0.24), rgba(76, 130, 251, .24)), linear-gradient(${vars.color.blue400}, ${vars.color.blue400})`,
    },
  },
])

export const removeButton = style([
  priceChangeButton,
  sprinkles({
    backgroundColor: 'backgroundInteractive',
  }),
  {
    ':hover': {
      background: `linear-gradient(rgba(76, 130, 251, 0.24), rgba(76, 130, 251, .24)), linear-gradient(${vars.color.backgroundInteractive}, ${vars.color.backgroundInteractive})`,
    },
  },
])

export const removeBagRowButton = style([
  buttonTextSmall,
  sprinkles({
    background: 'backgroundInteractive',
    color: 'textPrimary',
    paddingX: '14',
    paddingY: '12',
    borderRadius: '12',
  }),
])

export const bagRowImage = sprinkles({
  width: '56',
  height: '56',
  borderRadius: '8',
})

export const grayscaleImage = style({
  filter: 'grayscale(100%)',
})

export const unavailableImage = style([
  grayscaleImage,
  sprinkles({
    width: '44',
    height: '44',
    borderRadius: '8',
  }),
])

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

export const previewImageGrid = style([
  sprinkles({
    display: 'grid',
  }),
  {
    gridTemplateColumns: 'repeat(5, 13px)',
  },
])

export const toolTip = sprinkles({
  color: 'textSecondary',
  display: 'flex',
  flexShrink: '0',
})

export const removeAssetOverlay = style([
  sprinkles({
    position: 'absolute',
    right: '4',
    top: '4',
  }),
])

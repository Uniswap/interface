import { style } from '@vanilla-extract/css'
import { bodySmall, buttonTextSmall } from 'nft/css/common.css'
import { sprinkles, themeVars, vars } from 'nft/css/sprinkles.css'

export const bagRow = style([
  sprinkles({
    color: 'textPrimary',
    padding: '4',
    gap: '12',
    cursor: 'pointer',
    height: 'full',
    borderRadius: '12',
  }),
  {
    marginLeft: '-4px',
    marginRight: '-4px',
    ':hover': {
      background: themeVars.colors.backgroundOutline,
    },
  },
])

export const unavailableAssetsContainer = sprinkles({
  background: 'none',
  gap: '12',
  color: 'textPrimary',
  paddingY: '16',
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
  borderStyle: 'solid',
  borderWidth: '1px',
  borderColor: 'transparent',
  borderBottomColor: 'backgroundOutline',
  height: 'full',
  cursor: 'pointer',
})

export const priceChangeRow = style([
  sprinkles({
    color: 'textTertiary',
    gap: '4',
    fontSize: '14',
    fontWeight: 'normal',
  }),
  {
    lineHeight: '20px',
  },
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

export const bagRowImage = sprinkles({
  width: '72',
  height: '72',
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

export const removeAssetOverlay = style([
  sprinkles({
    position: 'absolute',
    right: '4',
    top: '4',
  }),
])

export const bagRowPrice = style([
  sprinkles({
    gap: '4',
    fontSize: '16',
    fontWeight: 'normal',
  }),
  {
    lineHeight: '24px',
  },
])

export const assetName = style([
  sprinkles({
    fontSize: '14',
    fontWeight: 'semibold',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  {
    lineHeight: '20px',
  },
])

export const collectionName = style([
  buttonTextSmall,
  sprinkles({
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  }),
  {
    lineHeight: '20px',
  },
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

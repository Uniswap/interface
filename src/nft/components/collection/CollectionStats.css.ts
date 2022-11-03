import { globalStyle, style } from '@vanilla-extract/css'
import { bodySmall, buttonTextSmall, headlineSmall } from 'nft/css/common.css'
import { loadingAsset, loadingBlock } from 'nft/css/loading.css'

import { breakpoints, sprinkles, themeVars } from '../../css/sprinkles.css'

export const statsText = style([
  sprinkles({
    marginTop: { sm: '8', md: '40' },
    marginBottom: { sm: '0', md: '28' },
  }),
  {
    '@media': {
      [`(max-width: ${breakpoints.sm - 1}px)`]: {
        marginLeft: '68px',
      },
    },
  },
])

export const smallStatsText = style({
  marginLeft: '84px',
})

export const statsRowItem = sprinkles({ paddingRight: '12' })

export const baseCollectionImage = sprinkles({
  left: '0',
  borderStyle: 'solid',
  borderWidth: '4px',
  borderColor: 'backgroundSurface',
  borderRadius: 'round',
  position: 'absolute',
})

export const collectionImage = style([
  baseCollectionImage,
  {
    width: '143px',
    height: '143px',
    verticalAlign: 'top',
    top: '-118px',
    '@media': {
      [`(max-width: ${breakpoints.sm - 1}px)`]: {
        width: '60px',
        height: '60px',
        borderWidth: '2px',
        top: '-20px',
      },
    },
  },
])

export const nameText = sprinkles({
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

export const description = style([
  sprinkles({
    fontSize: '14',
    display: 'inline-block',
  }),
  {
    maxWidth: 'min(calc(100% - 112px), 600px)',
    verticalAlign: 'top',
    lineHeight: '20px',
  },
])

globalStyle(`${description} a[href]`, {
  color: `${themeVars.colors.textSecondary}`,
  textDecoration: 'none',
})

globalStyle(`${description} a[href]:hover`, {
  color: `${themeVars.colors.textSecondary}`,
  opacity: `${themeVars.opacity.hover}`,
  textDecoration: 'none',
})

globalStyle(`${description} a[href]:focus`, {
  color: `${themeVars.colors.textSecondary}`,
  opacity: `${themeVars.opacity.pressed}`,
  textDecoration: 'none',
})

export const descriptionOpen = style([
  {
    whiteSpace: 'normal',
    verticalAlign: 'top',
    lineHeight: '20px',
  },
  sprinkles({
    overflow: 'visible',
    display: 'inline',
    maxWidth: 'full',
  }),
])

export const readMore = style([
  {
    verticalAlign: 'top',
    lineHeight: '20px',
  },
  buttonTextSmall,
  sprinkles({
    color: 'textSecondary',
    cursor: 'pointer',
    marginLeft: '4',
  }),
])

export const statsLabel = style([
  bodySmall,
  sprinkles({
    fontWeight: 'normal',
    color: 'textSecondary',
    whiteSpace: 'nowrap',
  }),
  {
    lineHeight: '20px',
  },
])

export const statsValue = style([
  headlineSmall,
  sprinkles({
    fontWeight: 'medium',
  }),
  {
    lineHeight: '24px',
    whiteSpace: 'nowrap',
  },
])

export const statsValueLoading = style([
  loadingAsset,
  sprinkles({
    width: '60',
    height: '20',
    marginTop: '8',
  }),
])

export const statsLabelLoading = style([
  loadingAsset,
  sprinkles({
    width: '60',
    height: '16',
  }),
])

export const descriptionLoading = style([
  loadingAsset,
  sprinkles({
    height: '20',
  }),
  {
    maxWidth: 'min(calc(100% - 112px), 600px)',
  },
])

export const collectionImageIsLoadingBackground = style([
  collectionImage,
  sprinkles({
    backgroundColor: 'backgroundSurface',
  }),
])

export const collectionImageIsLoading = style([
  loadingBlock,
  collectionImage,
  sprinkles({
    borderStyle: 'solid',
    borderWidth: '4px',
    borderColor: 'backgroundSurface',
  }),
])

export const nameTextLoading = style([
  loadingAsset,
  sprinkles({
    height: '32',
  }),
  {
    width: 236,
  },
])

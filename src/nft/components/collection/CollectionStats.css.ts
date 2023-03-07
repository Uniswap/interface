import { style } from '@vanilla-extract/css'
import { headlineSmall, subheadSmall } from 'nft/css/common.css'
import { loadingAsset, loadingBlock } from 'nft/css/loading.css'

import { breakpoints, sprinkles, vars } from '../../css/sprinkles.css'

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
    boxShadow: vars.color.cardDropShadow,
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

export const statsLabel = style([
  subheadSmall,
  sprinkles({
    color: 'textSecondary',
    whiteSpace: 'nowrap',
  }),
  {
    lineHeight: '20px',
  },
])

export const statsValue = style([
  headlineSmall,
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

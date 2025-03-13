import { style } from '@vanilla-extract/css'
import { headlineSmall, subheadSmall } from 'nft/css/common.css'
import { loadingAsset, loadingBlock } from 'nft/css/loading.css'
import { breakpoints } from 'ui/src/theme'

export const statsText = style({
  '@media': {
    [`(min-width: ${breakpoints.lg}px)`]: {
      marginTop: '40px',
      marginBottom: '28px',
    },
    [`(max-width: ${breakpoints.lg - 1}px)`]: {
      marginTop: '8px',
      marginBottom: '0px',
      marginLeft: '68px',
    },
  },
})

export const baseCollectionImage = style({
  left: '0',
  borderStyle: 'solid',
  borderWidth: '4px',
  borderColor: 'var(--surface1)',
  borderRadius: '999999px',
  position: 'absolute',
})

export const collectionImage = style([
  baseCollectionImage,
  {
    width: '143px',
    height: '143px',
    verticalAlign: 'top',
    top: '-118px',
    boxShadow: 'var(--cardDropShadow)',
    '@media': {
      [`(max-width: ${breakpoints.md - 1}px)`]: {
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
  {
    color: 'var(--neutral2)',
    whiteSpace: 'nowrap',
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
  {
    width: '60px',
    height: '20px',
    marginTop: '8px',
  },
])

export const statsLabelLoading = style([
  loadingAsset,
  {
    width: '60px',
    height: '16px',
  },
])

export const descriptionLoading = style([
  loadingAsset,
  {
    height: '20px',
    maxWidth: 'min(calc(100% - 112px), 600px)',
  },
])

export const collectionImageIsLoadingBackground = style([
  collectionImage,
  {
    backgroundColor: 'var(--surface1)',
  },
])

export const collectionImageIsLoading = style([
  loadingBlock,
  collectionImage,
  {
    borderStyle: 'solid',
    borderWidth: '4px',
    borderColor: 'var(--surface1)',
  },
])

export const nameTextLoading = style([
  loadingAsset,
  {
    height: '32px',
    width: '236px',
  },
])

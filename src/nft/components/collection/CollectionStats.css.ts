import { style } from '@vanilla-extract/css'
import { body, bodySmall } from 'nft/css/common.css'

import { breakpoints, sprinkles } from '../../css/sprinkles.css'

export const statsText = style([
  sprinkles({
    marginTop: { mobile: '8', tabletSm: '40' },
    marginBottom: { mobile: '0', tabletSm: '28' },
  }),
  {
    '@media': {
      [`(max-width: ${breakpoints.tabletSm - 1}px)`]: {
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
  borderColor: 'white',
})

export const collectionImage = style([
  baseCollectionImage,
  {
    width: '143px',
    height: '143px',
    verticalAlign: 'top',
    top: '-118px',
    '@media': {
      [`(max-width: ${breakpoints.tabletSm - 1}px)`]: {
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
  sprinkles({
    color: 'blue400',
    cursor: 'pointer',
    marginLeft: '4',
    fontSize: '14',
  }),
])

export const statsLabel = style([
  bodySmall,
  sprinkles({
    fontWeight: 'normal',
    color: 'darkGray',
    whiteSpace: 'nowrap',
  }),
  {
    lineHeight: '20px',
  },
])

export const statsValue = style([
  body,
  sprinkles({
    fontWeight: 'medium',
  }),
  {
    lineHeight: '24px',
  },
])

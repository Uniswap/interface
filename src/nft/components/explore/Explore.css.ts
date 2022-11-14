import { style } from '@vanilla-extract/css'
import { body, caption } from 'nft/css/common.css'
import { breakpoints, sprinkles } from 'nft/css/sprinkles.css'

export const section = style([
  sprinkles({
    paddingLeft: { sm: '16', xl: '0' },
    paddingRight: { sm: '16', xl: '0' },
  }),
  {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    position: 'relative',
  },
])

export const bannerWrap = style([
  sprinkles({
    position: 'relative',
    overflow: 'hidden',
    height: '386',
  }),
  {
    backgroundPosition: 'center',
    backgroundSize: 'cover',
  },
])

export const bannerOverlay = style([
  {
    height: '386px',
  },
  sprinkles({
    position: 'absolute',
    opacity: '0.7',
    width: 'full',
    backgroundColor: 'gray900',
    left: '0',
    top: '0',
  }),
])

export const collectionDetails = style([
  sprinkles({
    width: 'full',
  }),
  {
    '@media': {
      [`(min-width: ${breakpoints.lg}px)`]: {
        width: '40%',
      },
    },
  },
])

/* Activity Feed Styles */
export const activityRow = style([
  sprinkles({
    position: 'absolute',
    alignItems: { sm: 'flex-start', lg: 'center' },
  }),
  {
    transition: 'transform 0.4s ease',
  },
])

export const activeRow = sprinkles({
  backgroundColor: 'gray800',
})

export const timestamp = style([
  sprinkles({
    position: 'absolute',
    fontSize: '12',
    color: 'gray300',
    right: { sm: 'unset', lg: '12' },
    left: { sm: '64', lg: 'unset' },
    top: { sm: '28', lg: 'unset' },
  }),
])

export const marketplaceIcon = style([
  sprinkles({
    width: '16',
    height: '16',
    borderRadius: '4',
    flexShrink: '0',
    marginLeft: '8',
  }),
  {
    verticalAlign: 'bottom',
  },
])

/* Base Table Styles  */

export const table = style([
  {
    borderCollapse: 'collapse',
    boxShadow: '0 0 0 1px rgba(153, 161, 189, 0.24)',
    borderSpacing: '0px 40px',
  },
  sprinkles({
    background: 'backgroundSurface',
    width: 'full',
    borderRadius: '12',
    borderStyle: 'none',
  }),
])

export const thead = sprinkles({
  marginRight: '12',
  borderColor: 'outline',
  borderWidth: '1px',
  borderBottomStyle: 'solid',
})

export const th = style([
  caption,
  {
    selectors: {
      '&:nth-last-child(1)': {
        paddingRight: '20px',
      },
    },
  },
  sprinkles({
    color: { default: 'textSecondary' },
    paddingTop: '12',
    paddingBottom: '12',
  }),
])

export const td = style([
  body,
  {
    selectors: {
      '&:nth-last-child(1)': {
        paddingRight: '20px',
      },
    },
  },
  sprinkles({
    maxWidth: '160',
    paddingY: '8',
    textAlign: 'right',
    position: 'relative',
  }),
])

export const loadingTd = style([
  body,
  {
    selectors: {
      '&:nth-last-child(1)': {
        paddingRight: '20px',
      },
    },
  },
  sprinkles({
    maxWidth: '160',
    paddingY: '8',
    textAlign: 'right',
    position: 'relative',
  }),
])

export const trendingOptions = sprinkles({
  marginTop: '36',
  marginBottom: '20',
  height: '44',
  borderRadius: '12',
  borderWidth: '2px',
  borderStyle: 'solid',
  borderColor: 'outline',
})

/* Trending Colletion styles */
export const trendingOption = style([
  {
    marginTop: '-1px',
    marginLeft: '-1px',
  },
  sprinkles({
    paddingY: '14',
    paddingX: '16',
    borderRadius: '12',
    fontSize: '12',
    display: 'inline-block',
    cursor: 'pointer',
  }),
])

export const trendingOptionActive = sprinkles({ backgroundColor: 'accentActiveSoft' })

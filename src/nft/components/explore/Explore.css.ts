import { style } from '@vanilla-extract/css'
import { body, caption } from 'nft/css/common.css'
import { breakpoints, sprinkles } from 'nft/css/sprinkles.css'

export const section = style([
  sprinkles({
    paddingLeft: { sm: '16', xl: '0' },
    paddingRight: { sm: '16', xl: '0' },
  }),
  {
    maxWidth: '1000px',
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
    backgroundColor: 'grey900',
    left: '0',
    top: '0',
  }),
])

export const collectionName = style([
  sprinkles({
    textAlign: 'left',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    display: 'inline-block',
    color: 'explicitWhite',
  }),
  {
    maxWidth: 'calc(100% - 80px)',
  },
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

export const volumeRank = style([
  sprinkles({
    paddingTop: '8',
    paddingBottom: '8',
    paddingRight: '16',
    paddingLeft: '16',
    color: 'blue400',
    background: 'accentActionSoft',
  }),
  {
    borderRadius: '64px',
    maxWidth: '172px',
  },
])

export const exploreCollection = style([
  {
    width: '176px',
  },
  sprinkles({
    color: 'explicitWhite',
    marginTop: '36',
    borderRadius: '12',
    padding: '12',
    paddingRight: '16',
    paddingLeft: '16',
  }),
])

export const carouselIndicator = sprinkles({
  width: '36',
  height: '4',
  marginRight: '6',
  borderRadius: 'round',
  display: 'inline-block',
})

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
  backgroundColor: 'grey800',
})

export const timestamp = style([
  sprinkles({
    position: 'absolute',
    fontSize: '12',
    color: 'grey300',
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
    color: { default: 'textSecondary', hover: 'textPrimary' },
    cursor: 'pointer',
    paddingTop: '12',
    paddingBottom: '12',
  }),
])

export const tr = sprinkles({ cursor: 'pointer' })

export const rank = sprinkles({
  color: 'textSecondary',
  position: 'absolute',
  display: { md: 'inline-block', sm: 'none' },
  left: '24',
  top: '20',
})

export const td = style([
  body,
  {
    verticalAlign: 'middle',
    selectors: {
      '&:nth-last-child(1)': {
        paddingRight: '20px',
      },
    },
  },
  sprinkles({
    maxWidth: '160',
    paddingTop: '10',
    paddingBottom: '10',
    textAlign: 'right',
    position: 'relative',
  }),
])

export const trendingOptions = sprinkles({
  marginBottom: '32',
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

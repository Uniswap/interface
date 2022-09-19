import { style } from '@vanilla-extract/css'
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
    opacity: '0.7',
    height: '386px',
  },
  sprinkles({
    position: 'absolute',
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

/* Value Prop Styles */
export const valuePropWrap = style([
  {
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'auto',
    '@media': {
      [`(max-width: ${breakpoints.sm}px)`]: {
        backgroundPosition: 'top 0 left 100px',
      },
      [`(min-width: ${breakpoints.sm}px)`]: {
        backgroundPosition: 'top 0 right 0',
      },
    },
  },
  sprinkles({
    width: 'full',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'outline',
    borderRadius: '12',
    paddingLeft: '16',
    paddingRight: '16',
    marginTop: '60',
    position: 'relative',
  }),
])

export const valuePropOverlay = style([
  {
    height: '135px',
  },
  sprinkles({
    position: 'absolute',
    width: 'full',
    backgroundColor: 'grey900',
    left: '0',
    top: '0',
    opacity: { sm: '0.7', xl: '0.1' },
  }),
])

export const valuePropContent = style([
  sprinkles({
    position: 'relative',
    zIndex: '1',
    paddingLeft: { sm: '20', md: '28', lg: '36' },
    paddingBottom: '18',
    fontSize: { sm: '20', md: '28' },
    paddingTop: { sm: '28', md: '32' },
  }),
  {
    lineHeight: '28px',
    '@media': {
      [`(max-width: 400px)`]: { width: '88%' },
      [`(min-width: 400px)`]: { width: '67%' },
      [`(min-width: ${breakpoints.md}px)`]: {
        width: '58%',
        lineHeight: '36px',
      },
      [`(min-width: ${breakpoints.lg}px)`]: { width: '50%' },
    },
  },
])

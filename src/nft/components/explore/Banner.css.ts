import { style } from '@vanilla-extract/css'
import { breakpoints, sprinkles } from 'nft/css/sprinkles.css'

/* Override for BodyWrapper properties */
export const fullWidth = style([
  sprinkles({
    left: '1/2',
    right: '1/2',
    width: 'full',
    maxWidth: 'full',
    position: 'absolute',
  }),
  {
    top: '72px',
    marginLeft: '-50vw',
    marginRight: '-50vw',
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
    zIndex: '0',
    width: 'full',
    backgroundColor: 'grey900',
    left: '0',
    top: '0',
  }),
])

export const bannerContent = sprinkles({
  position: 'relative',
  zIndex: '1',
})

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
      [`screen and (min-width: ${breakpoints.tabletL}px)`]: {
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
    color: 'green200',
  }),
  {
    background: 'rgba(92, 254, 157, 0.12)',
    borderRadius: '64px',
    maxWidth: '175px',
  },
])

export const exploreCollection = style([
  {
    width: '174px',
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

export const carouselIndicator = style([
  sprinkles({
    backgroundColor: 'explicitWhite',
    width: '36',
    height: '4',
    marginRight: '6',
    borderRadius: 'round',
  }),
  {
    opacity: '0.4',
  },
])

export const carouselIndicatorActive = style({ opacity: '1.0' })

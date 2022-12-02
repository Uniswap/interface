import { style } from '@vanilla-extract/css'
import { buttonTextSmall, subhead, subheadSmall } from 'nft/css/common.css'

import { breakpoints, sprinkles, vars } from '../../nft/css/sprinkles.css'

const DESKTOP_NAVBAR_WIDTH = 330
const DESKTOP_NAVBAR_WIDTH_MD = 360
const DESKTOP_NAVBAR_WIDTH_L = 480
const DESKTOP_NAVBAR_WIDTH_XL = 520
const DESKTOP_NAVBAR_WIDTH_XXL = 640

const baseSearchStyle = style([
  sprinkles({
    paddingY: '12',
    width: { sm: 'viewWidth' },
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: 'searchOutline',
  }),
  {
    backdropFilter: 'blur(60px)',
    '@media': {
      [`screen and (min-width: ${breakpoints.sm}px)`]: {
        width: `${DESKTOP_NAVBAR_WIDTH_MD}px`,
      },
    },
  },
])

const baseSearchNftStyle = style([
  baseSearchStyle,
  {
    '@media': {
      [`screen and (min-width: ${breakpoints.md}px)`]: {
        width: `${DESKTOP_NAVBAR_WIDTH}px`,
      },
      [`screen and (min-width: ${breakpoints.lg}px)`]: {
        width: `${DESKTOP_NAVBAR_WIDTH_MD}px`,
      },
      [`screen and (min-width: ${breakpoints.xl}px)`]: {
        width: `${DESKTOP_NAVBAR_WIDTH_L}px`,
      },
      [`screen and (min-width: ${breakpoints.xxl}px)`]: {
        width: `${DESKTOP_NAVBAR_WIDTH_XL}px`,
      },
      [`screen and (min-width: ${breakpoints.xxxl}px)`]: {
        width: `${DESKTOP_NAVBAR_WIDTH_XXL}px`,
      },
    },
  },
])

export const searchBarContainer = style([
  sprinkles({
    right: '0',
    top: '0',
    zIndex: '3',
    display: 'inline-block',
  }),
])

export const searchBarContainerNft = style([
  sprinkles({
    right: '0',
    top: '0',
    zIndex: '3',
    display: 'inline-block',
  }),
  {
    backdropFilter: 'blur(60px)',
    borderRadius: '12px',
  },
])

export const searchBar = style([
  baseSearchStyle,
  sprinkles({
    color: 'textSecondary',
    paddingX: '16',
  }),
])

export const nftSearchBar = style([
  baseSearchNftStyle,
  sprinkles({
    color: 'textSecondary',
    paddingX: '16',
  }),
  {
    backdropFilter: 'blur(60px)',
  },
])

export const searchBarInput = style([
  sprinkles({
    padding: '0',
    fontWeight: 'normal',
    fontSize: '16',
    color: { default: 'textPrimary', placeholder: 'textSecondary' },
    border: 'none',
    background: 'none',
    lineHeight: '24',
    height: 'full',
  }),
])

export const searchBarDropdownNft = style([
  baseSearchNftStyle,
  sprinkles({
    borderBottomLeftRadius: '12',
    borderBottomRightRadius: '12',
    height: { sm: 'viewHeight', md: 'auto' },
    backgroundColor: 'backgroundSurface',
  }),
  {
    backdropFilter: 'blur(60px)',
    borderTop: 'none',
  },
])

export const suggestionRow = style([
  sprinkles({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingY: '8',
    paddingX: '16',
    cursor: 'pointer',
  }),
  {
    ':hover': {
      background: vars.color.lightGrayOverlay,
    },
    textDecoration: 'none',
  },
])

export const suggestionImage = sprinkles({
  width: '36',
  height: '36',
  borderRadius: 'round',
  marginRight: '8',
})

export const suggestionPrimaryContainer = style([
  sprinkles({
    alignItems: 'flex-start',
  }),
  {
    width: '90%',
  },
])

export const suggestionSecondaryContainer = sprinkles({
  textAlign: 'right',
  alignItems: 'flex-end',
})

export const primaryText = style([
  subhead,
  sprinkles({
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    color: 'textPrimary',
  }),
  {
    lineHeight: '24px',
  },
])

export const secondaryText = style([
  buttonTextSmall,
  sprinkles({
    color: 'textSecondary',
  }),
  {
    lineHeight: '20px',
  },
])

export const imageHolder = style([
  suggestionImage,
  sprinkles({
    background: 'backgroundModule',
    flexShrink: '0',
  }),
])

export const suggestionIcon = sprinkles({
  display: 'flex',
  flexShrink: '0',
})

export const sectionHeader = style([
  subheadSmall,
  sprinkles({
    color: 'textSecondary',
  }),
  {
    lineHeight: '20px',
  },
])

export const notFoundContainer = style([
  sectionHeader,
  sprinkles({
    paddingY: '4',
    paddingLeft: '16',
  }),
])

export const hidden = style([
  sprinkles({
    visibility: 'hidden',
    opacity: '0',
    padding: '0',
    height: '0',
  }),
])
export const visible = style([
  sprinkles({
    visibility: 'visible',
    opacity: '1',
    height: 'full',
  }),
])

export const searchContentLeftAlign = style({
  '@media': {
    [`screen and (min-width: ${breakpoints.lg}px)`]: {
      transform: 'translateX(0)',
      transition: `transform ${vars.time[125]}`,
      transitionTimingFunction: 'ease-in',
    },
  },
})

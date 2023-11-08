import { style } from '@vanilla-extract/css'
import { subhead, subheadSmall } from 'nft/css/common.css'

import { breakpoints, sprinkles, vars } from '../../nft/css/sprinkles.css'

const DESKTOP_NAVBAR_WIDTH = 330
const DESKTOP_NAVBAR_WIDTH_MD = 360
const DESKTOP_NAVBAR_WIDTH_L = 480
const DESKTOP_NAVBAR_WIDTH_XL = 520
const DESKTOP_NAVBAR_WIDTH_XXL = 640

const baseSearchStyle = style([
  sprinkles({
    paddingY: '8',
    width: { sm: 'viewWidth' },
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: 'surface3',
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

export const searchBarContainerNft = style([
  sprinkles({
    right: '0',
    top: '0',
    zIndex: '3',
    display: 'flex',
    maxHeight: 'searchResultsMaxHeight',
    overflow: 'hidden',
  }),
  {
    backdropFilter: 'blur(60px)',
    borderRadius: '16px',
  },
])

export const searchBarContainerDisableBlur = style({
  backdropFilter: 'none',
})

export const searchBar = style([
  baseSearchStyle,
  sprinkles({
    color: 'neutral2',
    paddingX: '12',
  }),
])

export const nftSearchBar = style([
  baseSearchNftStyle,
  sprinkles({
    color: 'neutral2',
    paddingX: '12',
  }),
  {
    backdropFilter: 'blur(60px)',
  },
])

export const searchBarInput = style([
  sprinkles({
    padding: '0',
    fontSize: '16',
    fontWeight: 'book',
    color: { default: 'neutral1', placeholder: 'neutral2' },
    border: 'none',
    background: 'none',
    lineHeight: '24',
    height: 'full',
  }),
])

export const searchBarDropdownNft = style([
  baseSearchNftStyle,
  sprinkles({
    borderBottomLeftRadius: '16',
    borderBottomRightRadius: '16',
    height: { sm: 'viewHeight', md: 'auto' },
    backgroundColor: 'surface1',
  }),
  {
    backdropFilter: 'blur(60px)',
    borderTop: 'none',
  },
])

export const searchBarScrollable = sprinkles({
  overflowY: 'auto',
})

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
    color: 'neutral1',
  }),
  {
    lineHeight: '24px',
  },
])

export const secondaryText = style([
  subheadSmall,
  sprinkles({
    color: 'neutral2',
  }),
  {
    lineHeight: '20px',
  },
])

export const imageHolder = style([
  suggestionImage,
  sprinkles({
    background: 'surface2',
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
    color: 'neutral2',
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

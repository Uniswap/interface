import { style } from '@vanilla-extract/css'
import { buttonTextSmall, subhead, subheadSmall } from 'nft/css/common.css'

import { breakpoints, sprinkles, vars } from '../../nft/css/sprinkles.css'

const DESKTOP_NAVBAR_WIDTH = 360
const MAGNIFYING_GLASS_ICON_WIDTH = 28

const baseSearchStyle = style([
  sprinkles({
    paddingY: '12',
    width: { sm: 'viewWidth' },
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: 'backgroundOutline',
  }),
  {
    '@media': {
      [`screen and (min-width: ${breakpoints.sm}px)`]: {
        width: `${DESKTOP_NAVBAR_WIDTH}px`,
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
  {
    '@media': {
      [`screen and (min-width: ${breakpoints.lg}px)`]: {
        right: `-${DESKTOP_NAVBAR_WIDTH / 2 - MAGNIFYING_GLASS_ICON_WIDTH}px`,
        top: '-3px',
      },
    },
  },
])

export const searchBar = style([
  baseSearchStyle,
  sprinkles({
    color: 'textTertiary',
    paddingX: '16',
    background: 'backgroundSurface',
  }),
])

export const searchBarInput = style([
  sprinkles({
    padding: '0',
    fontWeight: 'normal',
    fontSize: '16',
    color: { default: 'textPrimary', placeholder: 'textTertiary' },
    border: 'none',
    background: 'none',
    lineHeight: '24',
    height: 'full',
  }),
])

export const searchBarDropdown = style([
  baseSearchStyle,
  sprinkles({
    borderBottomLeftRadius: '12',
    borderBottomRightRadius: '12',
    background: 'backgroundSurface',
    height: { sm: 'viewHeight', md: 'auto' },
  }),
  {
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
    width: 'full',
  }),
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

const visibilityTransition = `visibility ${vars.time[125]}, opacity ${vars.time[125]}`
const delayedTransitionProperties = `padding 0s ${vars.time[125]}, height 0s ${vars.time[125]}`

export const hidden = style([
  sprinkles({
    visibility: 'hidden',
    opacity: '0',
    padding: '0',
    height: '0',
  }),
  {
    transition: `${visibilityTransition}, ${delayedTransitionProperties}`,
    transitionTimingFunction: 'ease-in',
  },
])
export const visible = style([
  sprinkles({
    visibility: 'visible',
    opacity: '1',
    height: 'full',
  }),
  {
    transition: `${visibilityTransition}`,
    transitionTimingFunction: 'ease-out',
  },
])

export const searchContentCentered = style({
  '@media': {
    [`screen and (min-width: ${breakpoints.lg}px)`]: {
      transform: `translateX(${DESKTOP_NAVBAR_WIDTH / 4}px)`,
      transition: `transform ${vars.time[125]}`,
      transitionTimingFunction: 'ease-out',
    },
  },
})

export const searchContentLeftAlign = style({
  '@media': {
    [`screen and (min-width: ${breakpoints.lg}px)`]: {
      transform: 'translateX(0)',
      transition: `transform ${vars.time[125]}`,
      transitionTimingFunction: 'ease-in',
    },
  },
})

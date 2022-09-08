import { style } from '@vanilla-extract/css'
import { buttonTextSmall, subhead, subheadSmall } from 'nft/css/common.css'

import { breakpoints, sprinkles, vars } from '../../nft/css/sprinkles.css'

const DESKTOP_NAVBAR_WIDTH = 360
const SEARCH_MAGNIFYING_GLASS_WIDTH = 28

const baseSearchStyle = style([
  sprinkles({
    paddingY: '12',
    width: { sm: 'viewWidth' },
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: 'medGray',
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
        right: `-${DESKTOP_NAVBAR_WIDTH / 2 - SEARCH_MAGNIFYING_GLASS_WIDTH}px`,
      },
    },
  },
])

export const searchBar = style([
  baseSearchStyle,
  sprinkles({
    color: 'placeholder',
    paddingX: '16',
    cursor: 'pointer',
    background: 'lightGray',
  }),
])

export const searchBarInput = style([
  sprinkles({
    padding: '0',
    fontWeight: 'normal',
    fontSize: '16',
    color: { default: 'blackBlue', placeholder: 'placeholder' },
    border: 'none',
    background: 'none',
  }),
  {
    lineHeight: '24px',
  },
])

export const searchBarDropdown = style([
  baseSearchStyle,
  sprinkles({
    borderBottomLeftRadius: '12',
    borderBottomRightRadius: '12',
    background: 'lightGray',
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
  }),
  {
    ':hover': {
      cursor: 'pointer',
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
    color: 'blackBlue',
  }),
  {
    lineHeight: '24px',
  },
])

export const secondaryText = style([
  buttonTextSmall,
  sprinkles({
    color: 'darkGray',
  }),
  {
    lineHeight: '20px',
  },
])

export const imageHolder = style([
  suggestionImage,
  sprinkles({
    background: 'loading',
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
    color: 'darkGray',
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
  {
    transition: `visibility .125s, opacity .125s, padding 0s .125s, height 0s .125s`,
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
    transition: `visibility .125s, opacity .125s`,
    transitionTimingFunction: 'ease-out',
  },
])

export const searchIconCentered = style({
  '@media': {
    [`screen and (min-width: ${breakpoints.lg}px)`]: {
      transform: `translateX(${DESKTOP_NAVBAR_WIDTH / 4}px)`,
      transition: `transform .125s`,
      transitionTimingFunction: 'ease-out',
    },
  },
})

export const searchIconLeftAlign = style({
  '@media': {
    [`screen and (min-width: ${breakpoints.lg}px)`]: {
      transform: `translateX(0)`,
      transition: `transform .125s`,
      transitionTimingFunction: 'ease-in',
    },
  },
})

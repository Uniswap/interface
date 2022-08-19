import { style } from '@vanilla-extract/css'
import { buttonTextSmall, subhead, subheadSmall } from 'nft/css/common.css'

import { breakpoints, sprinkles, vars } from '../../nft/css/sprinkles.css'

const DESKTOP_NAVBAR_WIDTH = '360px'

const baseSearchStyle = style([
  sprinkles({
    borderStyle: 'solid',
    borderColor: 'lightGrayButton',
    borderWidth: '1px',
    paddingY: '12',
    width: { mobile: 'viewWidth' },
  }),
  {
    '@media': {
      [`screen and (min-width: ${breakpoints.tabletSm}px)`]: {
        width: DESKTOP_NAVBAR_WIDTH,
      },
    },
  },
])

export const searchBar = style([
  baseSearchStyle,
  sprinkles({
    height: 'full',
    color: 'placeholder',
    paddingX: '16',
    cursor: 'pointer',
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
  { lineHeight: '24px' },
])

export const searchBarDropdown = style([
  baseSearchStyle,
  sprinkles({
    position: 'absolute',
    left: '0',
    top: '48',
    borderBottomLeftRadius: '12',
    borderBottomRightRadius: '12',
    background: 'white',
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
    transition: '250',
  }),
  {
    ':hover': {
      cursor: 'pointer',
      background: vars.color.lightGrayButton,
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

export const magnifyingGlassIcon = style([
  sprinkles({
    width: '20',
    height: '20',
    marginRight: '12',
  }),
])

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
    marginTop: '20',
  }),
])

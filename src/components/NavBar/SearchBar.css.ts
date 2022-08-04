import { style } from '@vanilla-extract/css'
import { buttonTextSmall, subhead, subheadSmall } from 'nft/css/common.css'

import { breakpoints, sprinkles } from '../../nft/css/sprinkles.css'

export const searchBar = style([
  sprinkles({
    height: 'full',
    color: 'placeholder',
    borderStyle: 'solid',
    borderColor: 'medGray',
    borderWidth: '1px',
    background: 'lightGray',
    paddingX: '16',
    paddingY: '12',
    width: { mobile: 'viewWidth' },
  }),
  {
    '@media': {
      [`screen and (min-width: ${breakpoints.tabletSm}px)`]: {
        width: '452px',
      },
    },
  },
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
  sprinkles({
    position: 'absolute',
    left: '0',
    top: '48',
    borderStyle: 'solid',
    borderColor: 'medGray',
    borderWidth: '1px',
    borderBottomLeftRadius: '12',
    borderBottomRightRadius: '12',
    background: 'lightGray',
    paddingY: '12',
    width: { mobile: 'viewWidth' },
  }),
  {
    borderTop: 'none',
    '@media': {
      [`screen and (min-width: ${breakpoints.tabletSm}px)`]: {
        width: '452px',
      },
    },
  },
])

export const suggestionRow = style([
  sprinkles({
    justifyContent: 'space-between',
    paddingY: '8',
    paddingX: '16',
  }),
  {
    ':hover': {
      cursor: 'pointer',
    },
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
  {
    background: 'radial-gradient(167.86% 167.86% at -21.43% -50%, #4C82FB 0%, #09265E 100%)',
  },
])

export const suggestionIcon = sprinkles({
  display: 'flex',
  flexShrink: '0',
})

export const magnifyingGlassIcon = style([
  sprinkles({
    width: '24',
    height: '24',
    marginRight: '16',
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

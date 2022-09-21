import { style } from '@vanilla-extract/css'
import { body, buttonTextMedium, subhead, subheadSmall } from 'nft/css/common.css'
import { breakpoints, sprinkles, themeVars, vars } from 'nft/css/sprinkles.css'

export const baseRow = style([
  sprinkles({
    display: 'grid',
  }),
  {
    gridTemplateColumns: '2.5fr 1fr',
    '@media': {
      [`screen and (min-width: ${breakpoints.md}px)`]: {
        gridTemplateColumns: '2fr 1.5fr 1fr 1fr',
      },
      [`screen and (min-width: ${breakpoints.lg}px)`]: {
        gridTemplateColumns: '1.75fr 1.4fr 1.1fr 1fr 1fr',
      },
      [`screen and (min-width: ${breakpoints.xl}px)`]: {
        gridTemplateColumns: '1.75fr 1.4fr 1.1fr 1fr 1fr 1fr',
      },
    },
  },
])

export const eventRow = style([
  baseRow,
  sprinkles({
    paddingY: '12',
    paddingX: '16',
    color: 'blackBlue',
    cursor: 'pointer',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderBottomColor: 'medGray',
  }),
  {
    height: '84px',
    ':hover': {
      background: themeVars.colors.lightGray,
    },
  },
])

export const headerRow = style([
  baseRow,
  sprinkles({
    paddingBottom: '8',
    color: 'darkGray',
    fontSize: '12',
    fontWeight: 'semibold',
    paddingX: '16',
  }),
  {
    lineHeight: '16px',
  },
])

export const detailsImage = sprinkles({
  width: '60',
  height: '60',
  borderRadius: '8',
})

export const detailsName = style([
  body,
  sprinkles({
    marginBottom: '6',
    fontWeight: 'normal',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  }),
  {
    lineHeight: '24px',
  },
])

export const eventDetail = style([
  subhead,
  sprinkles({
    marginBottom: '4',
    gap: '8',
  }),
  {
    lineHeight: '24px',
  },
])

export const eventTime = style([
  subheadSmall,
  sprinkles({
    color: 'darkGray',
  }),
  {
    lineHeight: '20px',
  },
])

export const addressCell = style([
  subhead,
  sprinkles({
    color: 'blackBlue',
    height: 'full',
    justifyContent: 'center',
  }),
  {
    lineHeight: '24px',
  },
])

export const baseBuyCell = style([
  buttonTextMedium,
  sprinkles({
    width: 'max',
    background: 'none',
    paddingY: '12',
    paddingX: '16',
    border: 'none',
    borderRadius: '12',
    transition: '250',
  }),
  {
    lineHeight: '20px',
  },
])

export const buyCell = style([
  baseBuyCell,
  {
    selectors: {
      '&:enabled': {
        cursor: 'pointer',
        color: vars.color.blue400,
      },
      '&:disabled': {
        color: themeVars.colors.placeholder,
      },
      '&:hover&:enabled': {
        background: vars.color.blue400,
        color: themeVars.colors.explicitWhite,
      },
    },
  },
])

export const removeCell = style([
  baseBuyCell,
  sprinkles({
    color: 'error',
    cursor: 'pointer',
  }),
  {
    ':hover': {
      background: vars.color.error,
      color: themeVars.colors.explicitWhite,
    },
  },
])

export const filter = style([
  subheadSmall,
  sprinkles({
    background: 'lightGrayButton',
    color: 'blackBlue',
    paddingY: '12',
    paddingX: '16',
    borderRadius: '12',
    cursor: 'pointer',
  }),
  {
    boxSizing: 'border-box',
  },
])

export const activeFilter = style([
  filter,
  sprinkles({
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'genieBlue',
  }),
])

export const marketplaceIcon = style([
  sprinkles({
    width: '16',
    height: '16',
    borderRadius: '4',
    flexShrink: '0',
  }),
])

export const ensNameContainer = sprinkles({
  width: 'max',
})

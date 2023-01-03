import { style } from '@vanilla-extract/css'
import { body, bodySmall, buttonTextMedium, subhead, subheadSmall } from 'nft/css/common.css'
import { breakpoints, sprinkles, themeVars, vars } from 'nft/css/sprinkles.css'

export const baseRow = style([
  sprinkles({
    display: 'grid',
  }),
  {
    gridTemplateColumns: '2.5fr 1fr',
    '@media': {
      [`screen and (min-width: ${breakpoints.sm}px)`]: {
        gridTemplateColumns: '2fr 1.5fr 1fr',
      },
      [`screen and (min-width: ${breakpoints.md}px)`]: {
        gridTemplateColumns: '1.75fr 1.4fr 1.1fr 1fr 1fr',
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
    paddingX: { sm: '4', md: '16' },
    color: 'textPrimary',
    cursor: 'pointer',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderBottomColor: 'backgroundOutline',
  }),
  {
    height: '84px',
    ':hover': {
      background: themeVars.colors.backgroundSurface,
    },
  },
])

export const headerRow = style([
  baseRow,
  sprinkles({
    paddingBottom: '8',
    color: 'textSecondary',
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
])

export const eventDetail = style([
  subhead,
  sprinkles({
    gap: '8',
  }),
  {
    lineHeight: '24px',
  },
])

export const eventTime = style([
  bodySmall,
  sprinkles({
    color: 'textSecondary',
  }),
  {
    lineHeight: '20px',
  },
])

export const addressCell = style([
  buttonTextMedium,
  sprinkles({
    color: 'textPrimary',
    height: 'full',
    justifyContent: 'center',
    paddingLeft: '2',
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
        color: vars.color.accentAction,
      },
      '&:disabled': {
        color: themeVars.colors.textTertiary,
      },
      '&:hover&:enabled': {
        background: vars.color.accentAction,
        color: themeVars.colors.explicitWhite,
      },
    },
  },
])

export const removeCell = style([
  baseBuyCell,
  sprinkles({
    color: 'accentFailure',
    cursor: 'pointer',
  }),
  {
    ':hover': {
      background: vars.color.accentFailure,
      color: themeVars.colors.explicitWhite,
    },
  },
])

export const filter = style([
  subheadSmall,
  sprinkles({
    background: 'backgroundInteractive',
    color: 'textPrimary',
    paddingY: '12',
    paddingX: '16',
    borderRadius: '12',
    cursor: 'pointer',
  }),
  {
    boxSizing: 'border-box',
  },
])

export const marketplaceIcon = style([
  sprinkles({
    width: '16',
    height: '16',
    borderRadius: '4',
    flexShrink: '0',
  }),
])

export const rarityInfo = style([
  sprinkles({
    display: 'flex',
    borderRadius: '4',
    height: '16',
    width: 'min',
    color: 'textPrimary',
    background: 'backgroundInteractive',
    fontSize: '10',
    fontWeight: 'semibold',
    paddingX: '4',
    cursor: 'pointer',
  }),
  {
    lineHeight: '12px',
    letterSpacing: '0.04em',
    backdropFilter: 'blur(6px)',
  },
])

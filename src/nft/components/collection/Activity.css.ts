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
    color: 'neutral1',
    cursor: 'pointer',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderBottomColor: 'surface3',
  }),
  {
    textDecoration: 'none',
    height: '84px',
    ':hover': {
      background: themeVars.colors.surface1,
    },
  },
])

export const headerRow = style([
  baseRow,
  sprinkles({
    paddingBottom: '8',
    color: 'neutral2',
    fontSize: '12',
    fontWeight: 'medium',
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
    fontWeight: 'book',
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
    color: 'neutral2',
  }),
  {
    lineHeight: '20px',
  },
])

export const addressCell = style([
  buttonTextMedium,
  sprinkles({
    color: 'neutral1',
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
        color: vars.color.accent1,
      },
      '&:disabled': {
        color: themeVars.colors.neutral3,
      },
      '&:hover&:enabled': {
        background: vars.color.accent1,
        color: themeVars.colors.white,
      },
    },
  },
])

export const removeCell = style([
  baseBuyCell,
  sprinkles({
    color: 'critical',
    cursor: 'pointer',
  }),
  {
    ':hover': {
      background: vars.color.critical,
      color: themeVars.colors.white,
    },
  },
])

export const filter = style([
  subheadSmall,
  sprinkles({
    background: 'surface3',
    color: 'neutral1',
    paddingY: '12',
    paddingX: '16',
    borderRadius: '12',
    cursor: 'pointer',
  }),
  {
    boxSizing: 'border-box',
  },
])

export const rarityInfo = style([
  sprinkles({
    display: 'flex',
    borderRadius: '4',
    height: '16',
    width: 'min',
    color: 'neutral1',
    background: 'surface3',
    fontSize: '10',
    fontWeight: 'medium',
    paddingX: '4',
    cursor: 'pointer',
  }),
  {
    lineHeight: '12px',
    letterSpacing: '0.04em',
    backdropFilter: 'blur(6px)',
  },
])

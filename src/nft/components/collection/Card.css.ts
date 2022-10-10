import { style } from '@vanilla-extract/css'
import { calc } from '@vanilla-extract/css-utils'
import { breakpoints, sprinkles, themeVars, vars } from 'nft/css/sprinkles.css'

export const card = style([
  sprinkles({
    overflow: 'hidden',
    borderStyle: 'solid',
    borderWidth: '1px',
  }),
  {
    boxSizing: 'border-box',
    WebkitBoxSizing: 'border-box',
    '@media': {
      [`(max-width: ${breakpoints.sm - 1}px)`]: {
        ':hover': {
          borderColor: themeVars.colors.backgroundOutline,
          cursor: 'pointer',
          background: vars.color.lightGrayOverlay,
        },
      },
    },
    ':hover': {
      boxShadow: themeVars.shadows.deep,
    },
  },
])

export const loadingBackground = style({
  background: `linear-gradient(270deg, ${themeVars.colors.backgroundOutline} 0%, ${themeVars.colors.backgroundSurface} 100%)`,
})

export const notSelectedCard = style([
  card,
  sprinkles({
    backgroundColor: 'backgroundSurface',
    borderColor: 'transparent',
  }),
])

export const cardImageHover = style({
  transform: 'scale(1.15)',
})

export const selectedCard = style([
  card,
  sprinkles({
    background: 'lightGrayOverlay',
    borderColor: 'backgroundOutline',
  }),
])

export const button = style([
  sprinkles({
    display: 'flex',
    width: 'full',
    position: 'relative',
    paddingY: '8',
    marginTop: { sm: '8', md: '10' },
    marginBottom: '12',
    borderRadius: '12',
    border: 'none',
    justifyContent: 'center',
    transition: '250',
    cursor: 'pointer',
  }),
  {
    lineHeight: '16px',
  },
])

export const marketplaceIcon = style([
  sprinkles({
    display: 'inline-block',
    width: '16',
    height: '16',
    borderRadius: '4',
    flexShrink: '0',
    marginLeft: '8',
  }),
  {
    verticalAlign: 'top',
  },
])

export const erc1155ButtonRow = sprinkles({
  flexShrink: '0',
  gap: '12',
  marginTop: { sm: '8', md: '10' },
  marginBottom: '12',
})

export const erc1155QuantityText = style([
  sprinkles({
    color: 'textPrimary',
  }),
  {
    lineHeight: '20px',
    userSelect: 'none',
  },
])

export const erc1155Button = sprinkles({
  display: 'flex',
  justifyContent: 'center',
  backgroundColor: 'accentActionSoft',
  textAlign: 'center',
  background: 'none',
  border: 'none',
  borderRadius: 'round',
  cursor: 'pointer',
  padding: '0',
  transition: '250',
})

export const erc1155PlusButton = style([
  erc1155Button,
  sprinkles({
    color: 'backgroundSurface',
  }),
  {
    ':hover': {
      backgroundColor: themeVars.colors.accentAction,
      color: themeVars.colors.textPrimary,
    },
  },
])

export const erc1155MinusButton = style([
  erc1155Button,
  sprinkles({
    color: 'accentFailure',
  }),
  {
    ':hover': {
      backgroundColor: themeVars.colors.accentFailure,
      color: themeVars.colors.textPrimary,
    },
  },
])

export const rarityInfo = style([
  sprinkles({
    display: 'flex',
    borderRadius: '4',
    height: '16',
    color: 'textPrimary',
    background: 'backgroundInteractive',
    fontSize: '10',
    fontWeight: 'semibold',
    paddingX: '4',
  }),
  {
    lineHeight: '12px',
    letterSpacing: '0.04em',
    backdropFilter: 'blur(6px)',
  },
])

export const playbackSwitch = style([
  sprinkles({
    position: 'absolute',
    width: '40',
    height: '40',
    zIndex: '1',
  }),
  {
    marginLeft: calc.subtract('100%', '50px'),
    transform: 'translateY(-56px)',
  },
])

import { style } from '@vanilla-extract/css'
import { breakpoints, sprinkles, themeVars } from 'nft/css/sprinkles.css'

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
      [`(max-width: ${breakpoints.tabletSm - 1}px)`]: {
        ':hover': {
          borderColor: themeVars.colors.medGray,
          cursor: 'pointer',
          background: themeVars.colors.lightGrayOverlay,
        },
      },
    },
  },
])

export const notSelectedCard = style([
  card,
  sprinkles({
    backgroundColor: 'lightGray',
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
    borderColor: 'medGray',
  }),
])

export const button = style([
  sprinkles({
    display: 'flex',
    width: 'full',
    position: 'relative',
    paddingY: '8',
    marginTop: { mobile: '8', tabletSm: '10' },
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
  marginTop: { mobile: '8', tabletSm: '10' },
  marginBottom: '12',
})

export const erc1155QuantityText = style([
  sprinkles({
    color: 'blackBlue',
  }),
  {
    lineHeight: '20px',
    userSelect: 'none',
  },
])

export const erc1155Button = sprinkles({
  display: 'flex',
  justifyContent: 'center',
  backgroundColor: 'white90',
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
    color: 'magicGradient',
  }),
  {
    ':hover': {
      backgroundColor: themeVars.colors.magicGradient,
      color: themeVars.colors.blackBlue,
    },
  },
])

export const erc1155MinusButton = style([
  erc1155Button,
  sprinkles({
    color: 'error',
  }),
  {
    ':hover': {
      backgroundColor: themeVars.colors.error,
      color: themeVars.colors.blackBlue,
    },
  },
])

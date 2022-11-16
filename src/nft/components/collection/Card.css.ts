import { style } from '@vanilla-extract/css'
import { calc } from '@vanilla-extract/css-utils'
import { sprinkles, themeVars, vars } from 'nft/css/sprinkles.css'

export const card = style([
  sprinkles({
    overflow: 'hidden',
    paddingBottom: '12',
    borderRadius: '16',
  }),
  {
    boxSizing: 'border-box',
    WebkitBoxSizing: 'border-box',
    boxShadow: vars.color.cardDropShadow,
    backgroundColor: themeVars.colors.backgroundSurface,
    ':after': {
      content: '',
      position: 'absolute',
      top: '0px',
      right: ' 0px',
      bottom: ' 0px',
      left: '0px',
      border: ' 1px solid',
      borderRadius: '16px',
      borderColor: '#5D678524',
      pointerEvents: 'none',
    },
  },
])

export const loadingBackground = style({
  background: `linear-gradient(270deg, ${themeVars.colors.backgroundOutline} 0%, ${themeVars.colors.backgroundSurface} 100%)`,
})

export const cardImageHover = style({
  transform: 'scale(1.15)',
})

export const selectedCard = style([
  card,
  sprinkles({
    background: 'backgroundSurface',
  }),
  {
    ':after': {
      border: '2px solid',
      borderColor: vars.color.accentAction,
    },
  },
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

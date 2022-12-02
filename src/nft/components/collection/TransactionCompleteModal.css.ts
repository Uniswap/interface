import { style } from '@vanilla-extract/css'
import { sprinkles, themeVars, vars } from 'nft/css/sprinkles.css'

export const modalContainer = style([
  sprinkles({
    display: 'flex',
    position: 'fixed',
    flexWrap: 'wrap',
    height: 'full',
    width: { sm: 'full', md: 'min' },
    left: { sm: '0', md: '1/2' },
    top: '0',
    zIndex: 'modal',
    overflow: 'scroll',
    paddingY: '72',
    paddingX: '12',
  }),
  {
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '24px',
    '@media': {
      'screen and (min-width: 656px)': {
        marginLeft: '-320px',
      },
    },
    '::-webkit-scrollbar': { display: 'none' },
    scrollbarWidth: 'none',
  },
])

export const successModal = style([
  sprinkles({
    background: 'backgroundSurface',
    borderRadius: '20',
    display: 'flex',
    flexWrap: 'wrap',
    height: 'min',
    position: 'relative',
    width: { sm: 'full', md: 'min' },
    paddingTop: { sm: '28', md: '28' },
    paddingBottom: { sm: '28', md: '28' },
  }),
  {
    boxShadow: vars.color.dropShadow,
    boxSizing: 'border-box',
    '@media': {
      'screen and (min-width: 656px)': {
        minWidth: '640px',
      },
    },
  },
])

export const uniLogo = style([
  sprinkles({
    position: 'absolute',
    left: { sm: '12', md: '32' },
    top: { sm: '16', md: '20' },
  }),
])

export const title = style([
  sprinkles({
    fontWeight: 'bold',
    color: 'textPrimary',
    fontSize: '20',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: '0',
    marginBottom: { sm: '8', md: '4' },
  }),
  {
    lineHeight: '25px',
  },
])

export const walletAddress = style([
  sprinkles({
    color: 'textSecondary',
    fontSize: '10',
    display: 'flex',
    alignItems: 'center',
    height: 'min',
    right: '16',
  }),
  {
    bottom: '42px',
    marginTop: '-2px',
    lineHeight: '13px',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
])

export const addressHash = style([
  sprinkles({
    color: 'textSecondary',
    fontSize: '10',
    fontWeight: 'normal',
    marginTop: '4',
  }),
  {
    lineHeight: '13px',
    letterSpacing: '0.04em',
  },
])

export const subHeading = style([
  sprinkles({
    color: 'textPrimary',
    fontSize: '14',
    width: 'full',
    textAlign: 'center',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: '0',
    marginBottom: '20',
  }),
  {
    lineHeight: '18px',
  },
])

export const successAssetsContainer = style([
  sprinkles({
    display: 'flex',
    flexWrap: 'wrap',
    width: 'full',
    overflow: 'scroll',
    justifyContent: 'center',
  }),
  {
    height: 'min',
    scrollbarWidth: 'none',
    selectors: {
      '&::-webkit-scrollbar': {
        display: 'none',
      },
    },
  },
])

export const successAssetImage = style([
  sprinkles({
    borderRadius: '12',
    flexShrink: '0',
  }),
  {
    height: 'auto',
    width: 'auto',
    boxSizing: 'border-box',
    objectFit: 'contain',
  },
])

export const successAssetImageGrid = style([
  sprinkles({
    marginRight: { sm: '4', md: '8' },
    marginBottom: { sm: '4', md: '8' },
  }),
])

export const overflowFade = style({
  backgroundImage: `linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, ${themeVars.colors.backgroundSurface} 100%)`,
  width: '576px',
  height: '20px',
  marginLeft: '32px',
  marginTop: '-20px',
})

export const totalEthCost = style([
  sprinkles({
    fontSize: '14',
    color: 'textSecondary',
    marginTop: '1',
    marginBottom: '0',
  }),
  {
    lineHeight: '18px',
  },
])

export const bottomBar = style([
  sprinkles({
    color: 'textPrimary',
    fontSize: '14',
  }),
])

export const button = style([
  sprinkles({
    height: '40',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '14',
    color: 'textPrimary',
    display: 'flex',
    alignItems: 'center',
    marginBottom: 'auto',
    marginRight: 'auto',
    bottom: { sm: '20', md: 'auto' },
  }),
  {
    left: 'calc(50% - 107px)',
    width: '214px',
    lineHeight: '18px',
    borderRadius: '100px',
    marginTop: '15px',
  },
])

export const mixedRefundModal = style([
  sprinkles({
    background: 'backgroundSurface',
    borderRadius: '20',
    display: 'flex',
    flexWrap: 'wrap',
    paddingTop: { sm: '24', md: '32' },
    paddingRight: { sm: '16', md: '24' },
    paddingLeft: { sm: '24', md: '32' },
    height: 'min',
    width: { sm: 'full', md: 'min' },
    position: 'relative',
    marginTop: '8',
  }),
  {
    boxShadow: vars.color.dropShadow,
    paddingBottom: '68px',
    '@media': {
      'screen and (min-width: 656px)': {
        minWidth: '640px',
        paddingBottom: '32px',
      },
    },
  },
])

export const subtitle = style([
  sprinkles({
    color: 'textPrimary',
    fontWeight: 'bold',
    fontSize: '16',
    marginLeft: '4',
    marginRight: 'auto',
    marginBottom: { sm: '0', md: 'auto' },
  }),
  {
    lineHeight: '20px',
    marginTop: '2px',
  },
])

export const interStd = style([
  sprinkles({
    color: 'textPrimary',
    fontSize: '14',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: '10',
    marginBottom: '16',
    width: 'full',
  }),
  {
    lineHeight: '18px',
  },
])

export const totalUsdRefund = style([
  sprinkles({
    color: 'textSecondary',
    fontSize: '12',
    marginLeft: '4',
  }),
  {
    lineHeight: '15px',
    marginTop: '3px',
    marginBottom: '2px',
  },
])

export const refundAssetsContainer = style([
  sprinkles({
    height: { sm: 'min', md: 'full' },
    width: { sm: 'full', md: 'half' },
    flexWrap: 'wrap',
    overflow: 'scroll',
    flexDirection: 'row',
    display: 'inline-flex',
    paddingLeft: { md: '16' },
  }),
  {
    maxHeight: '152px',
    scrollbarWidth: 'none',
    selectors: {
      '&::-webkit-scrollbar': {
        display: 'none',
      },
    },
  },
])

export const refundAssetImage = style([
  sprinkles({
    height: '52',
    width: '52',
    borderRadius: '8',
    marginRight: '4',
    marginBottom: '1',
  }),
  {
    boxSizing: 'border-box',
    border: `2px solid ${themeVars.colors.backgroundSurface}`,
    filter: 'grayscale(100%)',
  },
])

export const refundOverflowFade = style([
  sprinkles({
    width: { sm: 'full', md: 'half' },
    marginLeft: 'auto',
    zIndex: '1',
  }),
  {
    backgroundImage: `linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, ${themeVars.colors.backgroundSurface} 100%)`,
    height: '30px',
    marginRight: '18px',
    marginTop: '-20px',
  },
])

export const fullRefundModal = style([
  sprinkles({
    background: 'backgroundSurface',
    borderRadius: '20',
    display: 'flex',
    flexWrap: 'wrap',
    marginRight: 'auto',
    textAlign: 'center',
    marginLeft: { sm: 'auto', md: '100' },
    padding: '32',
    height: 'min',
  }),
  {
    boxShadow: vars.color.dropShadow,
    width: '344px',
  },
])

export const returnButton = style([
  sprinkles({
    height: '40',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '14',
    color: 'explicitWhite',
    backgroundColor: 'accentAction',
    display: 'flex',
    alignItems: 'center',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: '10',
  }),
  {
    width: '276px',
    lineHeight: '18px',
    borderRadius: '100px',
  },
])

export const fullRefundBackArrow = style([
  sprinkles({
    fill: 'explicitWhite',
    marginLeft: '12',
    marginRight: '28',
  }),
])

export const bodySmall = style([
  sprinkles({
    color: 'textPrimary',
    fontSize: '14',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: '4',
  }),
  {
    marginBottom: '22px',
    lineHeight: '18px',
  },
])

export const allUnavailableAssets = style([
  sprinkles({
    width: 'full',
  }),
  {
    overflow: 'auto',
    maxHeight: '210px',
    minHeight: '58px',
  },
])

export const fullRefundOverflowFade = style({
  backgroundImage: `linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, ${themeVars.colors.backgroundSurface} 100%)`,
  width: '266px',
  height: '20px',
  marginTop: '-20px',
  marginBottom: '20px',
  position: 'relative',
})

export const toggleUnavailable = style([
  sprinkles({
    backgroundColor: 'backgroundSurface',
    borderRadius: '8',
    display: 'flex',
    flexWrap: 'wrap',
    marginTop: '1',
    marginBottom: '1',
    height: '52',
    cursor: 'pointer',
  }),
])

export const unavailableAssetPreview = style([
  sprinkles({
    borderRadius: '4',
    height: '36',
    width: '36',
    position: 'relative',
  }),
  {
    boxSizing: 'border-box',
    border: `2px solid ${themeVars.colors.backgroundSurface}`,
    marginLeft: '-16px',
    filter: 'grayscale(100%)',
  },
])

export const unavailableText = style([
  sprinkles({
    color: 'textSecondary',
    fontWeight: 'normal',
    fontSize: '14',
    paddingTop: '8',
    paddingBottom: '8',
    paddingLeft: '12',
  }),
  {
    fontStyle: 'normal',
    lineHeight: '18px',
  },
])

export const unavailableItems = style([
  sprinkles({
    fontWeight: 'normal',
    fontSize: '12',
    display: 'flex',
  }),
  {
    fontStyle: 'normal',
    lineHeight: '15px',
  },
])

export const assetContainer = style({
  height: '48px',
  width: '48px',
  flexShrink: '0',
  marginRight: '4px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
})

export const fullRefundImage = style([
  sprinkles({
    borderRadius: '4',
    height: 'auto',
    maxHeight: '36',
    width: 'auto',
    maxWidth: '36',
    objectFit: 'contain',
  }),
  {
    boxSizing: 'border-box',
    filter: 'grayscale(100%)',
  },
])

export const chevron = style([
  sprinkles({
    marginBottom: 'auto',
    marginLeft: '0',
    marginRight: 'auto',
    height: '20',
    width: '20',
  }),
  {
    marginTop: '7px',
  },
])

export const chevronDown = style({
  transform: 'rotate(180deg)',
})

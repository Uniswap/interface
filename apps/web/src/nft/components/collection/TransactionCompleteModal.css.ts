import { style } from '@vanilla-extract/css'

export const modalContainer = style({
  display: 'flex',
  position: 'fixed',
  height: '100%',
  width: '100%',
  left: '0',
  top: '0',
  zIndex: '1060',
  overflow: 'scroll',
  paddingTop: '72px',
  paddingBottom: '72px',
  paddingLeft: '12px',
  paddingRight: '12px',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: '24px',
  scrollbarWidth: 'none',
  '::-webkit-scrollbar': {
    display: 'none',
  },
  '@media': {
    'screen and (min-width: 656px)': {
      width: 'min-content',
      left: '50%',
      marginLeft: '-320px',
    },
  },
})

export const successModal = style({
  background: 'var(--surface1)',
  borderRadius: '20px',
  display: 'flex',
  flexWrap: 'wrap',
  height: 'min-content',
  position: 'relative',
  width: '100%',
  paddingTop: '28px',
  paddingBottom: '28px',
  boxShadow: 'var(--dropShadow)',
  boxSizing: 'border-box',
  '@media': {
    'screen and (min-width: 656px)': {
      width: 'min-content',
      minWidth: '640px',
    },
  },
})

export const uniLogo = style({
  position: 'absolute',
  left: '12px',
  top: '16px',
  '@media': {
    'screen and (min-width: 656px)': {
      left: '32px',
      top: '20px',
    },
  },
})

export const title = style({
  fontWeight: '500',
  color: 'var(--neutral1)',
  fontSize: '20px',
  marginLeft: 'auto',
  marginRight: 'auto',
  marginTop: '0',
  marginBottom: '8px',
  lineHeight: '25px',
  '@media': {
    'screen and (min-width: 656px)': {
      marginBottom: '4px',
    },
  },
})

export const walletAddress = style({
  color: 'var(--neutral2)',
  fontSize: '10px',
  display: 'flex',
  alignItems: 'center',
  height: 'min-content',
  right: '16px',
  bottom: '42px',
  marginTop: '-2px',
  lineHeight: '13px',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
})

export const addressHash = style({
  color: 'var(--neutral2)',
  fontSize: '10px',
  fontWeight: '400',
  marginTop: '4px',
  lineHeight: '13px',
  letterSpacing: '0.04em',
})

export const subHeading = style({
  color: 'var(--neutral1)',
  fontSize: '14px',
  width: '100%',
  textAlign: 'center',
  marginLeft: 'auto',
  marginRight: 'auto',
  marginTop: '0',
  marginBottom: '20px',
  lineHeight: '18px',
})

export const successAssetsContainer = style({
  display: 'flex',
  flexWrap: 'wrap',
  width: '100%',
  overflow: 'scroll',
  justifyContent: 'center',
  height: 'min-content',
  scrollbarWidth: 'none',
  '::-webkit-scrollbar': {
    display: 'none',
  },
})

export const successAssetImage = style({
  borderRadius: '12px',
  flexShrink: '0',
  height: 'auto',
  width: 'auto',
  boxSizing: 'border-box',
  objectFit: 'contain',
})

export const successAssetImageGrid = style({
  marginRight: '4px',
  marginBottom: '4px',
  '@media': {
    'screen and (min-width: 656px)': {
      marginRight: '8px',
      marginBottom: '8px',
    },
  },
})

export const overflowFade = style({
  backgroundImage: `linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, var(--surface1) 100%)`,
  width: '576px',
  height: '20px',
  marginLeft: '32px',
  marginTop: '-20px',
})

export const totalEthCost = style({
  fontSize: '14px',
  color: 'var(--neutral2)',
  marginTop: '1px',
  marginBottom: '0',
  lineHeight: '18px',
})

export const bottomBar = style({
  color: 'var(--neutral1)',
  fontSize: '14px',
})

export const button = style({
  height: '40px',
  textAlign: 'center',
  fontWeight: '500',
  fontSize: '14px',
  color: 'var(--neutral1)',
  display: 'flex',
  alignItems: 'center',
  marginBottom: 'auto',
  marginRight: 'auto',
  left: 'calc(50% - 107px)',
  width: '214px',
  lineHeight: '18px',
  borderRadius: '100px',
  marginTop: '15px',
  bottom: '20px',
  '@media': {
    'screen and (min-width: 656px)': {
      bottom: 'auto',
    },
  },
})

export const mixedRefundModal = style({
  background: 'var(--surface1)',
  borderRadius: '20px',
  display: 'flex',
  flexWrap: 'wrap',
  paddingTop: '24px',
  paddingRight: '16px',
  paddingLeft: '24px',
  height: 'min-content',
  width: '100%',
  position: 'relative',
  marginTop: '8px',
  boxShadow: 'var(--dropShadow)',
  paddingBottom: '68px',
  '@media': {
    'screen and (min-width: 656px)': {
      width: 'min-content',
      minWidth: '640px',
      paddingTop: '32px',
      paddingRight: '24px',
      paddingLeft: '32px',
      paddingBottom: '32px',
    },
  },
})

export const subtitle = style({
  color: 'var(--neutral1)',
  fontWeight: '500',
  fontSize: '16px',
  marginLeft: '4px',
  marginRight: 'auto',
  marginTop: '2px',
  marginBottom: '0px',
  lineHeight: '20px',
  '@media': {
    'screen and (min-width: 656px)': {
      marginBottom: 'auto',
    },
  },
})

export const interStd = style({
  color: 'var(--neutral1)',
  fontSize: '14px',
  marginLeft: 'auto',
  marginRight: 'auto',
  marginTop: '10px',
  marginBottom: '16px',
  width: '100%',
  lineHeight: '18px',
})

export const totalUsdRefund = style({
  color: 'var(--neutral2)',
  fontSize: '12px',
  marginLeft: '4px',
  lineHeight: '15px',
  marginTop: '3px',
  marginBottom: '2px',
})

export const refundAssetsContainer = style({
  height: 'min-content',
  width: '100%',
  flexWrap: 'wrap',
  overflow: 'scroll',
  flexDirection: 'row',
  display: 'inline-flex',
  maxHeight: '152px',
  scrollbarWidth: 'none',
  '::-webkit-scrollbar': {
    display: 'none',
  },
  '@media': {
    'screen and (min-width: 656px)': {
      height: '100%',
      width: '50%',
      paddingLeft: '16px',
    },
  },
})

export const refundAssetImage = style({
  height: '52px',
  width: '52px',
  borderRadius: '8px',
  marginRight: '4px',
  marginBottom: '1px',
  boxSizing: 'border-box',
  border: `2px solid var(--surface1)`,
  filter: 'grayscale(100%)',
})

export const refundOverflowFade = style({
  width: '100%',
  marginLeft: 'auto',
  zIndex: '1',
  backgroundImage: `linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, var(--surface1) 100%)`,
  height: '30px',
  marginRight: '18px',
  marginTop: '-20px',
  '@media': {
    'screen and (min-width: 656px)': {
      width: '50%',
    },
  },
})

export const fullRefundModal = style({
  background: 'var(--surface1)',
  borderRadius: '20px',
  display: 'flex',
  flexWrap: 'wrap',
  marginRight: 'auto',
  textAlign: 'center',
  marginLeft: 'auto',
  padding: '32px',
  height: 'min-content',
  boxShadow: 'var(--dropShadow)',
  width: '344px',
  '@media': {
    'screen and (min-width: 656px)': {
      marginLeft: '100px',
    },
  },
})

export const returnButton = style({
  height: '40px',
  textAlign: 'center',
  fontWeight: '500',
  fontSize: '14px',
  color: 'var(--white)',
  backgroundColor: 'var(--accent1)',
  display: 'flex',
  alignItems: 'center',
  marginLeft: 'auto',
  marginRight: 'auto',
  marginTop: '10px',
  width: '276px',
  lineHeight: '18px',
  borderRadius: '100px',
})

export const fullRefundBackArrow = style({
  fill: 'var(--white)',
  marginLeft: '12px',
  marginRight: '28px',
})

export const bodySmall = style({
  color: 'var(--neutral1)',
  fontSize: '14px',
  marginLeft: 'auto',
  marginRight: 'auto',
  marginTop: '4px',
  marginBottom: '22px',
  lineHeight: '18px',
})

export const allUnavailableAssets = style({
  width: '100%',
  overflow: 'auto',
  maxHeight: '210px',
  minHeight: '58px',
})

export const fullRefundOverflowFade = style({
  backgroundImage: `linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, var(--surface1) 100%)`,
  width: '266px',
  height: '20px',
  marginTop: '-20px',
  marginBottom: '20px',
  position: 'relative',
})

export const toggleUnavailable = style({
  backgroundColor: 'var(--surface1)',
  borderRadius: '8px',
  display: 'flex',
  flexWrap: 'wrap',
  marginTop: '1px',
  marginBottom: '1px',
  height: '52px',
  cursor: 'pointer',
})

export const unavailableAssetPreview = style({
  borderRadius: '4px',
  height: '36px',
  width: '36px',
  position: 'relative',
  boxSizing: 'border-box',
  border: `2px solid var(--surface1)`,
  marginLeft: '-16px',
  filter: 'grayscale(100%)',
})

export const unavailableText = style({
  color: 'var(--neutral2)',
  fontWeight: '400',
  fontSize: '14px',
  paddingTop: '8px',
  paddingBottom: '8px',
  paddingLeft: '12px',
  fontStyle: 'normal',
  lineHeight: '18px',
})

export const unavailableItems = style({
  fontWeight: '400',
  fontSize: '12px',
  display: 'flex',
  fontStyle: 'normal',
  lineHeight: '15px',
})

export const assetContainer = style({
  height: '48px',
  width: '48px',
  flexShrink: '0',
  marginRight: '4px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
})

export const fullRefundImage = style({
  borderRadius: '4px',
  height: 'auto',
  maxHeight: '36px',
  width: 'auto',
  maxWidth: '36px',
  objectFit: 'contain',
  boxSizing: 'border-box',
  filter: 'grayscale(100%)',
})

export const chevron = style({
  marginBottom: 'auto',
  marginLeft: '0',
  marginRight: 'auto',
  height: '20px',
  width: '20px',
  marginTop: '7px',
})

export const chevronDown = style({
  transform: 'rotate(180deg)',
})

import { style } from '@vanilla-extract/css'
import { themeVars } from 'nft/css/sprinkles.css'

export const chevronDown = style({
  transform: 'rotate(180deg)',
})

export const dropdown = style({
  boxShadow: `0px 4px 16px ${themeVars.colors.backgroundSurface}`,
  marginLeft: '-12px',
})

export const removeAsset = style({
  top: '31px',
  left: '8px',
})

export const removeMarketplace = style({
  top: '11px',
  right: '14px',
})

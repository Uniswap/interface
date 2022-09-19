import { style } from '@vanilla-extract/css'
import { sprinkles, themeVars, vars } from 'nft/css/sprinkles.css'

export const buttonSelected = style({
  border: `1px solid ${vars.color.genieBlue}`,
})

export const nftDivider = style([
  sprinkles({
    height: '0',
    width: 'full',
    borderRadius: '20',
  }),
  {
    border: `0.5px solid ${themeVars.colors.medGray}`,
  },
])

export const priceChevron = style([
  sprinkles({
    height: '20',
    width: '20',
    transition: '250',
  }),
  {
    marginBottom: '-6px',
  },
])

export const durationChevron = style([
  sprinkles({
    height: '16',
    width: '16',
    transition: '250',
  }),
  {
    marginBottom: '-4px',
  },
])

export const chevronDown = style({
  transform: 'rotate(180deg)',
})

export const dropdown = style({
  boxShadow: `0px 4px 16px ${themeVars.colors.blackBlue20}`,
  marginLeft: '-12px',
})

export const removeAsset = style({
  top: '31px',
  left: '15px',
})

export const removeMarketplace = style({
  top: '11px',
  right: '14px',
})

import { style } from '@vanilla-extract/css'
import { loadingAsset } from 'nft/css/loading.css'

export const activeDropdown = style({
  borderBottom: 'none',
})

export const activeDropDownItems = style({
  borderTop: 'none',
})

export const isLoadingDropdown = style([
  loadingAsset,
  {
    width: 220,
    height: 44,
  },
])

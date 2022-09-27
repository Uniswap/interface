import { style } from '@vanilla-extract/css'
import { loadingAsset } from 'nft/css/loading.css'
import { sprinkles } from 'nft/css/sprinkles.css'

export const activeDropdown = style({
  borderBottom: 'none',
})

export const activeDropDownItems = style({
  borderTop: 'none',
})

export const isLoadingDropdown = style([
  loadingAsset,
  sprinkles({
    height: '44',
  }),
  {
    width: 220,
  },
])

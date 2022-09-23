import { style } from '@vanilla-extract/css'
import { sprinkles, themeVars, vars } from 'nft/css/sprinkles.css'
import { loadingAsset } from 'nft/css/loading.css'

export const filterButtonLoading = style([
  loadingAsset,
  sprinkles({
    border: 'none',
  }),
])

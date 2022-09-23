import { style } from '@vanilla-extract/css'
import { loadingAsset } from 'nft/css/loading.css'
import { sprinkles } from 'nft/css/sprinkles.css'

export const filterButtonLoading = style([
  loadingAsset,
  sprinkles({
    border: 'none',
  }),
])

import { style } from '@vanilla-extract/css'
import { loadingAsset } from 'nft/css/loading.css'

export const filterButtonLoading = style([
  loadingAsset,
  {
    border: 'none',
  },
])

import { style } from '@vanilla-extract/css'
import { loadingAsset } from 'nft/css/loading.css'

import { themeVars } from '../../css/sprinkles.css'

export const collectionAssetLoading = style([
  {
    backgroundColor: themeVars.colors.lightGray,
    borderRadius: 12,
    paddingBottom: 12,
  },
])

export const collectionAssetsImageLoading = style([
  loadingAsset,
  {
    position: 'absolute',
    height: '100%',
    width: '100%',
  },
])

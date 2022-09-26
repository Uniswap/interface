import { style } from '@vanilla-extract/css'
import { loadingAsset } from 'nft/css/loading.css'

import { sprinkles } from '../../css/sprinkles.css'

export const collectionAssetLoading = style([
  sprinkles({
    borderRadius: '12',
    paddingBottom: '12',
    backgroundColor: 'backgroundSurface',
  }),
])

export const collectionAssetsImageLoading = style([
  loadingAsset,
  sprinkles({
    position: 'absolute',
    height: 'full',
    width: 'full',
  }),
])

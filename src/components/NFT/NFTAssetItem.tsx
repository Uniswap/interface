import React from 'react'
import { NFTViewer } from 'src/components/images/NFTViewer'
import { NFTAsset } from 'src/features/nfts/types'

type Props = {
  autoplay?: boolean
  maxHeight?: number
  nft?: NFTAsset.Asset
}

export function NFTAssetItem({ autoplay = false, maxHeight, nft }: Props) {
  if (!nft) return null

  const { image_url: imageUrl } = nft

  return <NFTViewer autoplay={autoplay} maxHeight={maxHeight} uri={imageUrl} />
}

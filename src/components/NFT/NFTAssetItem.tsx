import React from 'react'
import { NFTViewer } from 'src/components/images/NFTViewer'
import { NFTAsset } from 'src/features/nfts/types'

type Props = {
  maxHeight?: number
  nft?: NFTAsset.Asset
}

export function NFTAssetItem({ maxHeight, nft }: Props) {
  if (!nft) return null

  const { image_url: imageUrl } = nft

  return <NFTViewer maxHeight={maxHeight} uri={imageUrl} />
}

import React from 'react'
import { NFTViewer } from 'src/components/images/NFTViewer'
import { NFTAsset } from 'src/features/nfts/types'
import { theme } from 'src/styles/theme'

type Props = {
  nft?: NFTAsset.Asset
  onPress?: (nft: NFTAsset.Asset) => void
}

export function NFTAssetItem({ nft }: Props) {
  if (!nft) return null

  const { image_url: imageUrl } = nft

  return <NFTViewer borderRadius={theme.borderRadii.none} uri={imageUrl} />
}

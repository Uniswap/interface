import * as Card from 'nft/components/collection/Card'
import { AssetMediaType } from 'nft/components/collection/Card'
import { useBag, useIsMobile, useSellAsset } from 'nft/hooks'
import { WalletAsset } from 'nft/types'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const NFT_DETAILS_HREF = (asset: WalletAsset) =>
  `/nfts/asset/${asset.asset_contract.address}/${asset.tokenId}?origin=profile`

export const ViewMyNftsAsset = ({ asset, isSellMode }: { asset: WalletAsset; isSellMode: boolean }) => {
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const selectSellAsset = useSellAsset((state) => state.selectSellAsset)
  const removeSellAsset = useSellAsset((state) => state.removeSellAsset)
  const cartExpanded = useBag((state) => state.bagExpanded)
  const toggleCart = useBag((state) => state.toggleBag)
  const isMobile = useIsMobile()
  const navigate = useNavigate()

  const [currentTokenPlayingMedia, setCurrentTokenPlayingMedia] = useState<string | undefined>()

  const isSelected = useMemo(() => {
    return sellAssets.some(
      (item) => item.tokenId === asset.tokenId && item.asset_contract.address === asset.asset_contract.address
    )
  }, [asset, sellAssets])

  const onCardClick = () => {
    isSellMode ? handleSelect(isSelected) : navigate(NFT_DETAILS_HREF(asset))
  }

  const handleSelect = (removeAsset: boolean) => {
    removeAsset ? removeSellAsset(asset) : selectSellAsset(asset)
    if (
      !cartExpanded &&
      !sellAssets.find(
        (x) => x.tokenId === asset.tokenId && x.asset_contract.address === asset.asset_contract.address
      ) &&
      !isMobile
    )
      toggleCart()
  }

  const assetMediaType = Card.useAssetMediaType(asset)

  return (
    <Card.Container
      asset={asset}
      selected={isSelected}
      addAssetToBag={() => handleSelect(false)}
      removeAssetFromBag={() => handleSelect(true)}
      onClick={onCardClick}
    >
      <Card.ImageContainer>
        {assetMediaType === AssetMediaType.Image ? (
          <Card.Image />
        ) : assetMediaType === AssetMediaType.Video ? (
          <Card.Video
            shouldPlay={asset.tokenId === currentTokenPlayingMedia}
            setCurrentTokenPlayingMedia={setCurrentTokenPlayingMedia}
          />
        ) : (
          <Card.Audio
            shouldPlay={asset.tokenId === currentTokenPlayingMedia}
            setCurrentTokenPlayingMedia={setCurrentTokenPlayingMedia}
          />
        )}
      </Card.ImageContainer>
      <Card.DetailsContainer>
        <Card.ProfileNftDetails asset={asset} />
      </Card.DetailsContainer>
    </Card.Container>
  )
}

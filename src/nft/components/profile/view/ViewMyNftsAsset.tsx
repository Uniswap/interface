import * as Card from 'nft/components/collection/Card'
import { AssetMediaType } from 'nft/components/collection/Card'
import { useBag, useIsMobile, useSellAsset } from 'nft/hooks'
import { WalletAsset } from 'nft/types'
import { floorFormatter } from 'nft/utils/numbers'
import { useMemo, useState } from 'react'

export const ViewMyNftsAsset = ({ asset, isSellMode }: { asset: WalletAsset; isSellMode: boolean }) => {
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const selectSellAsset = useSellAsset((state) => state.selectSellAsset)
  const removeSellAsset = useSellAsset((state) => state.removeSellAsset)
  const cartExpanded = useBag((state) => state.bagExpanded)
  const toggleCart = useBag((state) => state.toggleBag)
  const isMobile = useIsMobile()

  const [currentTokenPlayingMedia, setCurrentTokenPlayingMedia] = useState<string | undefined>()
  // const [boxHovered, toggleBoxHovered] = useReducer((state) => {
  //   return !state
  // }, false)
  // const [buttonHovered, toggleButtonHovered] = useReducer((state) => {
  //   return !state
  // }, false)

  const isSelected = useMemo(() => {
    return sellAssets.some(
      (item) => item.tokenId === asset.tokenId && item.asset_contract.address === asset.asset_contract.address
    )
  }, [asset, sellAssets])

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

  // const uniqueSellOrdersMarketplaces = useMemo(
  //   () => [...new Set(asset.sellOrders?.map((order) => order.marketplace))],
  //   [asset.sellOrders]
  // )

  const assetMediaType = Card.useAssetMediaType(asset)

  console.log('name', asset.collectionName)
  console.log('collection stats', asset.collection.stats)
  return (
    <Card.Container
      asset={asset}
      selected={isSelected}
      addAssetToBag={() => handleSelect(false)}
      removeAssetFromBag={() => handleSelect(true)}
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
        <Card.InfoContainer>
          <Card.PrimaryRow>
            <Card.PrimaryDetails>
              <Card.PrimaryInfo>{asset.name ? asset.name : `#${asset.tokenId}`}</Card.PrimaryInfo>
              {asset.susFlag && <Card.Suspicious />}
            </Card.PrimaryDetails>
            <Card.DetailsLink />
          </Card.PrimaryRow>
          <Card.SecondaryRow>
            <Card.SecondaryDetails>
              <Card.SecondaryInfo>{`${floorFormatter(asset.floorPrice ?? 0)} ETH`}</Card.SecondaryInfo>
            </Card.SecondaryDetails>
          </Card.SecondaryRow>
        </Card.InfoContainer>
      </Card.DetailsContainer>
    </Card.Container>
  )
}

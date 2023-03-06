import { BigNumber } from '@ethersproject/bignumber'
import { sendAnalyticsEvent, useTrace } from '@uniswap/analytics'
import { InterfacePageName, NFTEventName } from '@uniswap/analytics-events'
import { useBag } from 'nft/hooks'
import { GenieAsset, UniformAspectRatio } from 'nft/types'
import { formatWeiToDecimal } from 'nft/utils'
import { useCallback, useMemo } from 'react'

import { NftCard, NftCardDisplayProps } from '../card'
import { Ranking as RankingContainer, Suspicious as SuspiciousContainer } from '../card/containers'

const useNotForSale = (asset: GenieAsset) =>
  useMemo(() => {
    let notForSale = true
    notForSale = asset.notForSale || BigNumber.from(asset.priceInfo ? asset.priceInfo.ETHPrice : 0).lt(0)
    return notForSale
  }, [asset])

interface CollectionAssetProps {
  asset: GenieAsset
  isMobile: boolean
  mediaShouldBePlaying: boolean
  setCurrentTokenPlayingMedia: (tokenId: string | undefined) => void
  rarityVerified?: boolean
  uniformAspectRatio: UniformAspectRatio
  setUniformAspectRatio: (uniformAspectRatio: UniformAspectRatio) => void
  renderedHeight?: number
  setRenderedHeight: (renderedHeight: number | undefined) => void
}

export const CollectionAsset = ({
  asset,
  isMobile,
  mediaShouldBePlaying,
  setCurrentTokenPlayingMedia,
  uniformAspectRatio,
  setUniformAspectRatio,
  renderedHeight,
  setRenderedHeight,
}: CollectionAssetProps) => {
  const bagManuallyClosed = useBag((state) => state.bagManuallyClosed)
  const addAssetsToBag = useBag((state) => state.addAssetsToBag)
  const removeAssetsFromBag = useBag((state) => state.removeAssetsFromBag)
  const itemsInBag = useBag((state) => state.itemsInBag)
  const bagExpanded = useBag((state) => state.bagExpanded)
  const setBagExpanded = useBag((state) => state.setBagExpanded)
  const trace = useTrace({ page: InterfacePageName.NFT_COLLECTION_PAGE })

  const { isSelected } = useMemo(() => {
    const matchingItems = itemsInBag.filter(
      (item) => asset.tokenId === item.asset.tokenId && asset.address === item.asset.address
    )

    const isSelected = matchingItems.length > 0
    return {
      isSelected,
    }
  }, [asset, itemsInBag])

  const notForSale = useNotForSale(asset)

  const provider = useMemo(() => {
    return asset?.rarity?.providers?.find(({ provider: _provider }) => _provider === asset.rarity?.primaryProvider)
  }, [asset])

  const handleAddAssetToBag = useCallback(() => {
    if (BigNumber.from(asset.priceInfo?.ETHPrice ?? 0).gt(0)) {
      addAssetsToBag([asset])
      if (!bagExpanded && !isMobile && !bagManuallyClosed) {
        setBagExpanded({ bagExpanded: true })
      }
      sendAnalyticsEvent(NFTEventName.NFT_BUY_ADDED, {
        collection_address: asset.address,
        token_id: asset.tokenId,
        token_type: asset.tokenType,
        ...trace,
      })
    }
  }, [addAssetsToBag, asset, bagExpanded, bagManuallyClosed, isMobile, setBagExpanded, trace])

  const handleRemoveAssetFromBag = useCallback(() => {
    removeAssetsFromBag([asset])
  }, [asset, removeAssetsFromBag])

  const display: NftCardDisplayProps = useMemo(() => {
    return {
      primaryInfo: asset.name ? asset.name : `#${asset.tokenId}`,
      primaryInfoExtra: asset.susFlag ? <SuspiciousContainer /> : undefined,
      primaryInfoRight: asset.rarity && provider ? <RankingContainer provider={provider} /> : undefined,
      secondaryInfo: notForSale ? '' : `${formatWeiToDecimal(asset.priceInfo.ETHPrice, true)} ETH`,
      selectedInfo: 'Remove from bag',
      notSelectedInfo: 'Add to bag',
    }
  }, [asset.name, asset.priceInfo.ETHPrice, asset.rarity, asset.susFlag, asset.tokenId, notForSale, provider])

  return (
    <NftCard
      asset={asset}
      display={display}
      isSelected={isSelected}
      isDisabled={Boolean(asset.notForSale)}
      addAssetToBag={handleAddAssetToBag}
      removeAssetFromBag={handleRemoveAssetFromBag}
      mediaShouldBePlaying={mediaShouldBePlaying}
      uniformAspectRatio={uniformAspectRatio}
      setUniformAspectRatio={setUniformAspectRatio}
      renderedHeight={renderedHeight}
      setRenderedHeight={setRenderedHeight}
      setCurrentTokenPlayingMedia={setCurrentTokenPlayingMedia}
      testId="nft-collection-asset"
    />
  )
}

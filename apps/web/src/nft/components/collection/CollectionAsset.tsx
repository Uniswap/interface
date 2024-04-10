import { BigNumber } from '@ethersproject/bignumber'
import { Trans } from '@lingui/macro'
import { InterfacePageName, NFTEventName } from '@uniswap/analytics-events'
import { sendAnalyticsEvent, useTrace } from 'analytics'
import { NftCard, NftCardDisplayProps } from 'nft/components/card'
import { Ranking as RankingContainer, Suspicious as SuspiciousContainer } from 'nft/components/card/icons'
import { useBag } from 'nft/hooks'
import { GenieAsset, UniformAspectRatio } from 'nft/types'
import { useCallback, useMemo } from 'react'
import { NumberType, useFormatter } from 'utils/formatNumbers'

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
  const { formatEther } = useFormatter()
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

  const notForSale = asset.notForSale || BigNumber.from(asset.priceInfo ? asset.priceInfo.ETHPrice : 0).lt(0)
  const provider = asset?.rarity?.providers ? asset.rarity.providers[0] : undefined
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
      primaryInfoIcon: asset.susFlag ? <SuspiciousContainer /> : null,
      primaryInfoRight: asset.rarity && provider ? <RankingContainer provider={provider} /> : null,
      secondaryInfo: notForSale
        ? ''
        : `${formatEther({ input: asset.priceInfo.ETHPrice, type: NumberType.NFTToken })} ETH`,
      selectedInfo: <Trans>Remove from bag</Trans>,
      notSelectedInfo: <Trans>Add to bag</Trans>,
      disabledInfo: <Trans>Not listed</Trans>,
    }
  }, [
    asset.name,
    asset.priceInfo.ETHPrice,
    asset.rarity,
    asset.susFlag,
    asset.tokenId,
    formatEther,
    notForSale,
    provider,
  ])

  return (
    <NftCard
      asset={asset}
      display={display}
      isSelected={isSelected}
      isDisabled={Boolean(asset.notForSale)}
      selectAsset={handleAddAssetToBag}
      unselectAsset={handleRemoveAssetFromBag}
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

import { BigNumber } from '@ethersproject/bignumber'
import { parseEther } from '@ethersproject/units'
import { Trans } from '@lingui/macro'
import { sendAnalyticsEvent, useTrace } from '@uniswap/analytics'
import { InterfacePageName, NFTEventName } from '@uniswap/analytics-events'
import { NftStandard } from 'graphql/data/__generated__/types-and-hooks'
import { useNftSellOrders } from 'graphql/data/nft/SellOrders'
import { NftCard, NftCardDisplayProps } from 'nft/components/card'
import { Ranking as RankingContainer, Suspicious as SuspiciousContainer } from 'nft/components/card/icons'
import { useBag } from 'nft/hooks'
import { GenieAsset, UniformAspectRatio } from 'nft/types'
import { formatWeiToDecimal } from 'nft/utils'
import { useCallback, useMemo } from 'react'

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
  const isErc1155 = asset.tokenType === NftStandard.Erc1155

  const { isSelected, quantitySelected } = useMemo(() => {
    const matchingItems = itemsInBag.filter(
      (item) => asset.tokenId === item.asset.tokenId && asset.address === item.asset.address
    )

    return {
      isSelected: matchingItems.length > 0,
      quantitySelected: matchingItems.length,
    }
  }, [asset, itemsInBag])

  const notForSale = asset.notForSale || BigNumber.from(asset.priceInfo ? asset.priceInfo.ETHPrice : 0).lt(0)
  const provider = asset?.rarity?.providers ? asset.rarity.providers[0] : undefined

  const { sellOrders, hasNext, loadMore } = useNftSellOrders(asset.address, asset.tokenId, isErc1155 && isSelected)
  const shouldUseSellOrders = isErc1155 && isSelected
  const shouldDisableErc1155AddButton = shouldUseSellOrders && (!sellOrders || sellOrders.length <= quantitySelected)

  const handleAddAssetToBag = useCallback(() => {
    if (shouldDisableErc1155AddButton) return

    const newSellOrderPrice =
      shouldUseSellOrders && sellOrders
        ? parseEther(sellOrders[quantitySelected].price.value.toString()).toString()
        : undefined

    const assetToAdd: GenieAsset = newSellOrderPrice
      ? {
          ...asset,
          priceInfo: {
            ...asset.priceInfo,
            ETHPrice: newSellOrderPrice,
            basePrice: newSellOrderPrice,
          },
        }
      : asset

    if (BigNumber.from(assetToAdd.priceInfo.ETHPrice).gt(0)) {
      if (shouldUseSellOrders && sellOrders && sellOrders.length === quantitySelected + 2 && hasNext) {
        loadMore()
      }

      addAssetsToBag([assetToAdd])

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
  }, [
    addAssetsToBag,
    asset,
    bagExpanded,
    bagManuallyClosed,
    hasNext,
    isMobile,
    loadMore,
    quantitySelected,
    sellOrders,
    setBagExpanded,
    shouldDisableErc1155AddButton,
    shouldUseSellOrders,
    trace,
  ])

  const handleRemoveAssetFromBag = useCallback(() => {
    if (!isErc1155) {
      removeAssetsFromBag([asset])
      return
    }

    const assets = itemsInBag
      .filter((item) => item.asset.address === asset.address && item.asset.tokenId === asset.tokenId)
      .map((item) => item.asset)
    if (assets.length === 0) return

    const mostExpensiveAsset = assets.reduce(
      (acc, cur) => (BigNumber.from(cur.priceInfo.basePrice).gte(BigNumber.from(acc.priceInfo.basePrice)) ? cur : acc),
      assets[0]
    )

    removeAssetsFromBag([mostExpensiveAsset])
  }, [asset, isErc1155, itemsInBag, removeAssetsFromBag])

  const display: NftCardDisplayProps = useMemo(() => {
    return {
      primaryInfo: asset.name ? asset.name : `#${asset.tokenId}`,
      primaryInfoIcon: asset.susFlag ? <SuspiciousContainer /> : null,
      primaryInfoRight: asset.rarity && provider ? <RankingContainer provider={provider} /> : null,
      secondaryInfo: notForSale ? '' : `${formatWeiToDecimal(asset.priceInfo.ETHPrice, true)} ETH`,
      selectedInfo: <Trans>Remove from bag</Trans>,
      notSelectedInfo: <Trans>Add to bag</Trans>,
      disabledInfo: <Trans>Not listed</Trans>,
    }
  }, [asset.name, asset.priceInfo.ETHPrice, asset.rarity, asset.susFlag, asset.tokenId, notForSale, provider])

  return (
    <NftCard
      asset={asset}
      display={display}
      isSelected={isSelected}
      quantitySelected={quantitySelected}
      isDisabled={Boolean(asset.notForSale)}
      disableErc1155AddToBag={shouldDisableErc1155AddButton}
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

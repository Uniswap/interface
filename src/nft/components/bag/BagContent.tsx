import { sendAnalyticsEvent, Trace } from '@uniswap/analytics'
import { EventName } from '@uniswap/analytics-events'
import { BagRow, PriceChangeBagRow, UnavailableAssetsHeaderRow } from 'nft/components/bag/BagRow'
import { Column } from 'nft/components/Flex'
import { useBag, useIsMobile } from 'nft/hooks'
import { BagItemStatus, BagStatus } from 'nft/types'
import { fetchPrice, formatAssetEventProperties, recalculateBagUsingPooledAssets } from 'nft/utils'
import { useEffect, useMemo } from 'react'
import { useQuery } from 'react-query'

export const BagContent = () => {
  const bagStatus = useBag((s) => s.bagStatus)
  const setBagStatus = useBag((s) => s.setBagStatus)
  const markAssetAsReviewed = useBag((s) => s.markAssetAsReviewed)
  const didOpenUnavailableAssets = useBag((s) => s.didOpenUnavailableAssets)
  const setDidOpenUnavailableAssets = useBag((s) => s.setDidOpenUnavailableAssets)
  const uncheckedItemsInBag = useBag((s) => s.itemsInBag)
  const setItemsInBag = useBag((s) => s.setItemsInBag)
  const removeAssetsFromBag = useBag((s) => s.removeAssetsFromBag)

  const isMobile = useIsMobile()

  const itemsInBag = useMemo(() => {
    return recalculateBagUsingPooledAssets(uncheckedItemsInBag)
  }, [uncheckedItemsInBag])

  const { data: fetchedPriceData } = useQuery(['fetchPrice', {}], () => fetchPrice(), {})

  const { unchangedAssets, priceChangedAssets, unavailableAssets, availableItems } = useMemo(() => {
    const unchangedAssets = itemsInBag
      .filter((item) => item.status === BagItemStatus.ADDED_TO_BAG || item.status === BagItemStatus.REVIEWED)
      .map((item) => item.asset)
    const priceChangedAssets = itemsInBag
      .filter((item) => item.status === BagItemStatus.REVIEWING_PRICE_CHANGE)
      .map((item) => item.asset)
    const unavailableAssets = itemsInBag
      .filter((item) => item.status === BagItemStatus.UNAVAILABLE)
      .map((item) => item.asset)
    const availableItems = itemsInBag.filter((item) => item.status !== BagItemStatus.UNAVAILABLE)

    return { unchangedAssets, priceChangedAssets, unavailableAssets, availableItems }
  }, [itemsInBag])

  useEffect(() => {
    const hasAssetsInReview = priceChangedAssets.length > 0
    const hasAssets = itemsInBag.length > 0

    if (hasAssetsInReview)
      sendAnalyticsEvent(EventName.NFT_BUY_BAG_CHANGED, {
        usd_value: fetchedPriceData,
        bag_quantity: itemsInBag,
        ...formatAssetEventProperties(priceChangedAssets),
      })

    if (bagStatus === BagStatus.IN_REVIEW && !hasAssetsInReview) {
      if (hasAssets) setBagStatus(BagStatus.CONFIRM_REVIEW)
      else setBagStatus(BagStatus.ADDING_TO_BAG)
    }

    if (bagStatus === BagStatus.CONFIRM_REVIEW && !hasAssets) {
      setBagStatus(BagStatus.ADDING_TO_BAG)
    }
  }, [bagStatus, itemsInBag, priceChangedAssets, setBagStatus, fetchedPriceData])

  return (
    <>
      <Column display={priceChangedAssets.length > 0 || unavailableAssets.length > 0 ? 'flex' : 'none'}>
        {unavailableAssets.length > 0 && (
          <Trace
            name={EventName.NFT_BUY_BAG_CHANGED}
            properties={{
              usd_value: fetchedPriceData,
              bag_quantity: itemsInBag.length,
              ...formatAssetEventProperties(unavailableAssets),
            }}
            shouldLogImpression
          >
            <UnavailableAssetsHeaderRow
              assets={unavailableAssets}
              usdPrice={fetchedPriceData}
              clearUnavailableAssets={() => setItemsInBag(availableItems)}
              didOpenUnavailableAssets={didOpenUnavailableAssets}
              setDidOpenUnavailableAssets={setDidOpenUnavailableAssets}
              isMobile={isMobile}
            />
          </Trace>
        )}
        {priceChangedAssets.map((asset, index) => (
          <PriceChangeBagRow
            key={asset.id}
            asset={asset}
            usdPrice={fetchedPriceData}
            markAssetAsReviewed={markAssetAsReviewed}
            top={index === 0 && unavailableAssets.length === 0}
            isMobile={isMobile}
          />
        ))}
      </Column>
      <Column>
        {unchangedAssets
          .slice(0)
          .reverse()
          .map((asset) => (
            <BagRow
              key={asset.id}
              asset={asset}
              usdPrice={fetchedPriceData}
              removeAsset={removeAssetsFromBag}
              showRemove={true}
              isMobile={isMobile}
            />
          ))}
      </Column>
    </>
  )
}

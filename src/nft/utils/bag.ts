import { BagItem, BagItemStatus, BagStatus, RoutingItem, UpdatedGenieAsset } from 'nft/types'

import { compareAssetsWithTransactionRoute } from './txRoute/combineItemsWithTxRoute'
import { filterUpdatedAssetsByState } from './updatedAssets'

export function getPurchasableAssets(itemsInBag: BagItem[]): UpdatedGenieAsset[] {
  return itemsInBag.filter((item) => item.status !== BagItemStatus.UNAVAILABLE).map((item) => item.asset)
}

function createBagFromUpdatedAssets(
  unavailable: UpdatedGenieAsset[],
  priceChanged: UpdatedGenieAsset[],
  unchanged: UpdatedGenieAsset[]
): BagItem[] {
  return [
    ...unavailable.map((unavailableAsset) => ({
      asset: unavailableAsset,
      status: BagItemStatus.UNAVAILABLE,
    })),
    ...priceChanged.map((changedAsset) => ({
      asset: changedAsset,
      status: BagItemStatus.REVIEWING_PRICE_CHANGE,
    })),
    ...unchanged.map((unchangedAsset) => ({
      asset: unchangedAsset,
      status: BagItemStatus.REVIEWED,
    })),
  ]
}

function evaluateNextBagState(
  hasAssets: boolean,
  shouldReview: boolean,
  hasAssetsInReview: boolean,
  shouldRefetchCalldata: boolean
): { nextBagStatus: BagStatus; lockBag: boolean } {
  if (!hasAssets) {
    return { nextBagStatus: BagStatus.ADDING_TO_BAG, lockBag: false }
  }

  if (shouldReview) {
    if (hasAssetsInReview) {
      return { nextBagStatus: BagStatus.IN_REVIEW, lockBag: false }
    }

    return { nextBagStatus: BagStatus.CONFIRM_REVIEW, lockBag: false }
  }

  if (shouldRefetchCalldata) {
    return { nextBagStatus: BagStatus.CONFIRM_QUOTE, lockBag: false }
  }

  return { nextBagStatus: BagStatus.CONFIRMING_IN_WALLET, lockBag: true }
}

export function getNextBagState(
  wishAssetsToBuy: UpdatedGenieAsset[],
  route: RoutingItem[],
  purchasingWithErc20: boolean
) {
  const { hasPriceAdjustment, updatedAssets } = compareAssetsWithTransactionRoute(wishAssetsToBuy, route)
  const shouldRefetchCalldata = hasPriceAdjustment && purchasingWithErc20

  const { unchanged, priceChanged, unavailable } = filterUpdatedAssetsByState(updatedAssets)

  const hasReviewedAssets = unchanged.length > 0
  const hasAssetsInReview = priceChanged.length > 0
  const hasUnavailableAssets = unavailable.length > 0

  const hasAssets = hasReviewedAssets || hasAssetsInReview || hasUnavailableAssets
  const shouldReview = hasAssetsInReview || hasUnavailableAssets
  const newBagItems = createBagFromUpdatedAssets(unavailable, priceChanged, unchanged)
  const { nextBagStatus, lockBag } = evaluateNextBagState(
    hasAssets,
    shouldReview,
    hasAssetsInReview,
    shouldRefetchCalldata
  )

  return { newBagItems, nextBagStatus, lockBag }
}

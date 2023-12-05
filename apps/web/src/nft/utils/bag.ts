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
): BagStatus {
  if (!hasAssets) {
    return BagStatus.ADDING_TO_BAG
  }

  if (shouldReview) {
    if (hasAssetsInReview) {
      return BagStatus.IN_REVIEW
    }

    return BagStatus.CONFIRM_REVIEW
  }

  if (shouldRefetchCalldata) {
    return BagStatus.CONFIRM_QUOTE
  }

  return BagStatus.CONFIRMING_IN_WALLET
}

export function getNextBagState(
  wishAssetsToBuy: UpdatedGenieAsset[],
  route: RoutingItem[],
  purchasingWithErc20: boolean
): { newBagItems: BagItem[]; nextBagStatus: BagStatus } {
  const { hasPriceAdjustment, updatedAssets } = compareAssetsWithTransactionRoute(wishAssetsToBuy, route)
  const shouldRefetchCalldata = hasPriceAdjustment && purchasingWithErc20

  const { unchanged, priceChanged, unavailable } = filterUpdatedAssetsByState(updatedAssets)

  const hasAssets = updatedAssets.length > 0
  const hasAssetsInReview = priceChanged.length > 0
  const hasUnavailableAssets = unavailable.length > 0
  const shouldReview = hasAssetsInReview || hasUnavailableAssets

  const newBagItems = createBagFromUpdatedAssets(unavailable, priceChanged, unchanged)
  const nextBagStatus = evaluateNextBagState(hasAssets, shouldReview, hasAssetsInReview, shouldRefetchCalldata)

  return { newBagItems, nextBagStatus }
}

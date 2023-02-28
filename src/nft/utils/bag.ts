import { BagItem, BagItemStatus, BagStatus, UpdatedGenieAsset } from 'nft/types'

export function getPurchasableAssets(itemsInBag: BagItem[]): UpdatedGenieAsset[] {
  return itemsInBag.filter((item) => item.status !== BagItemStatus.UNAVAILABLE).map((item) => item.asset)
}

export function createBagFromUpdatedAssets(
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

export function getNextBagState(
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

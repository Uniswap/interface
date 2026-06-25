import { isAndroid } from '@universe/environment'
import type { TokenItemData } from 'src/components/explore/TokenItemData'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import type { TokenMetadataDisplayType } from 'wallet/src/features/wallet/types'

export const EXPLORE_TOKEN_ROW_HEIGHT = 67.25
export const EXPLORE_LIST_DRAW_ROWS = 60
export const EXPLORE_SKELETON_ROW_COUNT = 12
export const EXPLORE_LIST_INITIAL_ITEM_COUNT = 20
export const EXPLORE_LIST_ITEM_REVEAL_STEP = 25
export const EXPLORE_LIST_TRAILING_SKELETON_COUNT = 3

export type ExploreSkeletonRow = {
  rowType: 'skeleton'
  key: string
}

export type ExploreTokenRow = {
  rowType: 'token'
  key: string
  tokenItemData: TokenItemData
  tokenMetadataDisplayType: TokenMetadataDisplayType
}

export type ExploreListItem = ExploreSkeletonRow | ExploreTokenRow

// Displays items placeholders instead of passing an empty [] during loading
export const EXPLORE_SKELETON_LIST_ITEMS: ExploreSkeletonRow[] = Array.from(
  { length: EXPLORE_SKELETON_ROW_COUNT },
  (_, index) => ({
    rowType: 'skeleton',
    key: `explore-skeleton-${index}`,
  }),
)

export function tokenItemDataKey(tokenItemData: TokenItemData): string {
  return tokenItemData.address
    ? buildCurrencyId(tokenItemData.chainId, tokenItemData.address)
    : buildNativeCurrencyId(tokenItemData.chainId)
}

export function exploreListItemKey(item: ExploreListItem): string {
  return item.key
}

export function getExploreListItemType(item: ExploreListItem): string {
  return item.rowType
}

export function getExploreListItemSize(): number {
  return EXPLORE_TOKEN_ROW_HEIGHT
}

function tokenItemDataAreEqual(prev: TokenItemData, next: TokenItemData): boolean {
  return (
    prev.name === next.name &&
    prev.logoUrl === next.logoUrl &&
    prev.chainId === next.chainId &&
    prev.address === next.address &&
    prev.symbol === next.symbol &&
    prev.price === next.price &&
    prev.marketCap === next.marketCap &&
    prev.pricePercentChange24h === next.pricePercentChange24h &&
    prev.volume24h === next.volume24h &&
    prev.totalValueLocked === next.totalValueLocked &&
    prev.networkCount === next.networkCount
  )
}

export function exploreListItemsAreEqual(prev: ExploreListItem, next: ExploreListItem): boolean {
  if (prev.key !== next.key || prev.rowType !== next.rowType) {
    return false
  }
  if (prev.rowType === 'skeleton') {
    return true
  }
  if (next.rowType === 'skeleton') {
    return false
  }
  return (
    prev.tokenMetadataDisplayType === next.tokenMetadataDisplayType &&
    tokenItemDataAreEqual(prev.tokenItemData, next.tokenItemData)
  )
}

export function scheduleAfterPaint(callback: () => void): () => void {
  const raf = { id: 0 }
  raf.id = requestAnimationFrame(() => {
    if (isAndroid) {
      raf.id = requestAnimationFrame(callback)
    } else {
      callback()
    }
  })
  return () => {
    cancelAnimationFrame(raf.id)
  }
}

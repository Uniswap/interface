import { TXN_HISTORY_LOADER_ICON_SIZE } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { ActivityItem } from 'uniswap/src/components/activity/generateActivityItemRenderer'

export const TXN_HISTORY_ICON_SIZE = TXN_HISTORY_LOADER_ICON_SIZE
export const TXN_STATUS_ICON_SIZE = iconSizes.icon16

export type LoadingItem = {
  itemType: 'LOADING'
  id: number
}
export function isLoadingItem(x: ActivityItem): x is LoadingItem {
  return 'itemType' in x && x.itemType === 'LOADING'
}

export type SectionHeader = {
  itemType: 'HEADER'
  title: string
}
export function isSectionHeader(x: ActivityItem): x is SectionHeader {
  return 'itemType' in x && x.itemType === 'HEADER'
}

export function getActivityItemType(item: ActivityItem): string {
  if (isLoadingItem(item)) {
    return `loading`
  } else if (isSectionHeader(item)) {
    return `sectionHeader`
  } else {
    return `activity`
  }
}

import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'

export type LoadingItem = {
  itemType: 'LOADING'
  id: number
}
export function isLoadingItem(x: TransactionDetails | SectionHeader | LoadingItem): x is LoadingItem {
  return 'itemType' in x && x.itemType === 'LOADING'
}

export type SectionHeader = {
  itemType: 'HEADER'
  title: string
}
export function isSectionHeader(x: TransactionDetails | SectionHeader | LoadingItem): x is SectionHeader {
  return 'itemType' in x && x.itemType === 'HEADER'
}

export function getActivityItemType(item: TransactionDetails | SectionHeader | LoadingItem): string {
  if (isLoadingItem(item)) {
    return `loading`
  } else if (isSectionHeader(item)) {
    return `sectionHeader`
  } else {
    return `activity`
  }
}

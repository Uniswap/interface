import { ContentStyle } from '@shopify/flash-list'
import { EffectCallback, MutableRefObject } from 'react'
import { FocusedRowControl } from 'uniswap/src/components/lists/items/OptionItem'
import { OnchainItemListOption } from 'uniswap/src/components/lists/items/types'
import type { OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { SectionHeaderProps } from 'uniswap/src/components/lists/SectionHeader'
import { PlatformSplitStubError } from 'utilities/src/errors'

export interface OnchainItemListRef {
  scrollToLocation: (params: { itemIndex: number; sectionIndex: number; animated: boolean }) => void
}

export type SectionRowInfo = { section: SectionHeaderProps }

export interface ItemRowInfo<T extends OnchainItemListOption> {
  item: T
  section: OnchainItemSection<T>
  index: number
  rowIndex: number
  expanded?: boolean
}

export interface OnchainItemListProps<T extends OnchainItemListOption> {
  sectionListRef?: MutableRefObject<OnchainItemListRef | undefined>
  ListEmptyComponent?: JSX.Element
  focusHook?: (callback: EffectCallback) => void
  keyExtractor?: (item: T, index: number) => string
  renderItem: (info: ItemRowInfo<T>) => JSX.Element | null
  renderSectionHeader?: (info: SectionRowInfo) => JSX.Element
  sections: OnchainItemSection<T>[]
  expandedItems?: string[]
  renderedInModal: boolean
  focusedRowControl?: Omit<FocusedRowControl, 'rowIndex'>
  contentContainerStyle?: ContentStyle
}

export function OnchainItemList<T extends OnchainItemListOption>(_props: OnchainItemListProps<T>): JSX.Element {
  throw new PlatformSplitStubError('OnchainItemList')
}

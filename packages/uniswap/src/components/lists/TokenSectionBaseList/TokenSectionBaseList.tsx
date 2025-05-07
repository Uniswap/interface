import { EffectCallback, MutableRefObject } from 'react'
import { TokenSection } from 'uniswap/src/components/TokenSelector/types'
import { TokenSectionHeaderProps } from 'uniswap/src/components/lists/TokenSectionHeader'
import { ItemType } from 'uniswap/src/components/lists/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export interface TokenSectionBaseListRef {
  scrollToLocation: (params: { itemIndex: number; sectionIndex: number; animated: boolean }) => void
}

export type SectionRowInfo = { section: TokenSectionHeaderProps }

export interface ItemRowInfo<T extends ItemType> {
  item: T
  section: TokenSection<T>
  index: number
  expanded?: boolean
}

export interface TokenSectionBaseListProps<T extends ItemType> {
  sectionListRef?: MutableRefObject<TokenSectionBaseListRef | undefined>
  ListEmptyComponent?: JSX.Element
  focusHook?: (callback: EffectCallback) => void
  keyExtractor?: (item: T, index: number) => string
  renderItem: (info: ItemRowInfo<T>) => JSX.Element | null
  renderSectionHeader?: (info: SectionRowInfo) => JSX.Element
  sections: TokenSection<T>[]
  expandedItems?: string[]
}

export function TokenSectionBaseList<T extends ItemType>(_props: TokenSectionBaseListProps<T>): JSX.Element {
  throw new PlatformSplitStubError('TokenSectionBaseList')
}

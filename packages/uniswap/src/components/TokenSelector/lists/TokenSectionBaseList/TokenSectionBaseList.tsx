import { EffectCallback, MutableRefObject } from 'react'
import { TokenSectionHeaderProps } from 'uniswap/src/components/TokenSelector/items/TokenSectionHeader'
import { TokenOption, TokenSection } from 'uniswap/src/components/TokenSelector/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export interface TokenSectionBaseListRef {
  scrollToLocation: (params: { itemIndex: number; sectionIndex: number; animated: boolean }) => void
}

export type SectionRowInfo = { section: TokenSectionHeaderProps }

export interface ItemRowInfo {
  item: TokenOption | TokenOption[]
  section: TokenSection
  index: number
  expanded?: boolean
}

export interface TokenSectionBaseListProps {
  sectionListRef?: MutableRefObject<TokenSectionBaseListRef | undefined>
  ListEmptyComponent?: JSX.Element
  focusHook?: (callback: EffectCallback) => void
  keyExtractor?: (item: TokenOption | TokenOption[], index: number) => string
  renderItem: (info: ItemRowInfo) => JSX.Element | null
  renderSectionHeader?: (info: SectionRowInfo) => JSX.Element
  renderSectionFooter?: (info: SectionRowInfo) => JSX.Element
  sections: TokenSection[]
  expandedItems?: string[]
}

export function TokenSectionBaseList(_props: TokenSectionBaseListProps): JSX.Element {
  throw new PlatformSplitStubError('TokenSectionBaseList')
}

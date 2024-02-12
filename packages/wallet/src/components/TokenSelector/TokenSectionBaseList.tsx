import { EffectCallback, MutableRefObject } from 'react'
import { NotImplementedError } from 'utilities/src/errors'
import {
  SuggestedTokenSection,
  TokenOption,
  TokenSection,
  TokenSelectorListSections,
} from 'wallet/src/components/TokenSelector/types'

export type SectionHeaderProps = Pick<TokenSection, 'title' | 'rightElement'>

export interface TokenSectionBaseListRef {
  scrollToLocation: (params: { itemIndex: number; sectionIndex: number; animated: boolean }) => void
}

export type SectionRowInfo = { section: SectionHeaderProps }

export interface ItemRowInfo {
  item: TokenOption | TokenOption[]
  section: SuggestedTokenSection | TokenSection
  index: number
}

export interface TokenSectionBaseListProps {
  sectionListRef?: MutableRefObject<TokenSectionBaseListRef | undefined>
  ListEmptyComponent?: JSX.Element
  focusHook?: (callback: EffectCallback) => void
  keyExtractor?: (item: TokenOption | TokenOption[], index: number) => string
  renderItem: (info: ItemRowInfo) => JSX.Element | null
  renderSectionHeader?: (info: SectionRowInfo) => JSX.Element
  sections: TokenSelectorListSections
}

export function TokenSectionBaseList(_props: TokenSectionBaseListProps): JSX.Element {
  throw new NotImplementedError('TokenSectionBaseList')
}

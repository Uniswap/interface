import { UniverseChainId } from '@universe/chains'
import type { UniversalListProps, UniversalListRef } from '@universe/mycelium'
import { CSSProperties, Ref } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { SharedValue } from 'react-native-reanimated'
import { SearchInputProps } from 'uniswap/src/components/nfts/types'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { NFTItem } from 'uniswap/src/features/nfts/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

/** A rendered row: an NFT, or one of the sentinel strings (empty-cell padding, hidden-NFTs row). */
export type NftsListItem = NFTItem | string

/**
 * List-level props forwarded to the underlying virtualized list. Native only — the web
 * implementation is a separate DOM virtualizer and ignores every one of them.
 */
type ForwardedListProps = Pick<
  UniversalListProps<NftsListItem>,
  | 'contentContainerStyle'
  | 'ListFooterComponent'
  | 'numColumns'
  | 'onContentSizeChange'
  | 'onRefresh'
  | 'onScroll'
  | 'refreshing'
  | 'showsVerticalScrollIndicator'
  | 'testID'
>

export type NftsListProps = ForwardedListProps & {
  /**
   * Scroll the page instead of an inner container. Deliberately outside {@link ForwardedListProps}:
   * that group is ignored by the web implementation, whereas this one reaches a DOM engine — the
   * extension imports `NftsList.native` by path, and the `UniversalList` inside it resolves to the
   * web `VirtualList` there. `NftsList.web` ignores it like the rest of the group.
   */
  useWindowScroll?: UniversalListProps<NftsListItem>['useWindowScroll']
  /** Native only. Imperative handle on the underlying list (scrollToTop, scrollToOffset, …). */
  ref?: Ref<UniversalListRef>
  owner: Address
  chainsFilter?: UniverseChainId[]
  footerHeight?: SharedValue<number>
  isExternalProfile?: boolean
  renderedInModal?: boolean
  /**
   * Keep this stable (memoized). The web list feeds its identity into `extraData`, so an inline
   * function invalidates every cell and re-lays out the grid on each render.
   */
  renderNFTItem: (item: NFTItem, index: number) => JSX.Element
  onPressEmptyState?: () => void
  loadingStateStyle?: StyleProp<ViewStyle | CSSProperties | (ViewStyle & CSSProperties)>
  errorStateStyle?: StyleProp<ViewStyle | CSSProperties | (ViewStyle & CSSProperties)>
  emptyStateStyle?: StyleProp<ViewStyle | CSSProperties | (ViewStyle & CSSProperties)>
  skip?: boolean
  customEmptyState?: JSX.Element
  autoColumns?: boolean
  /** Web-only: when true, use a flex-wrap container instead of 2-col grid */
  wrapFlex?: boolean
  /** Custom loading state skeleton - if provided, overrides default loading skeleton */
  customLoadingState?: JSX.Element
  /** Optional: override the numHidden count (e.g., for filtered results) */
  filteredNumHidden?: number
  /** Optional: callback to receive filtered counts (shown and hidden) */
  onFilteredCountsChange?: (params: { shown: number; hidden: number }) => void
  /** Optional: custom render function for the ExpandoRow component */
  renderExpandoRow?: (props: { isExpanded: boolean; label: string; onPress: () => void }) => JSX.Element
  /** Optional: callback to receive the refetch function */
  onRefetchReady?: (refetch: () => void) => void
  /** Optional: callback to receive the loading state */
  onLoadingStateChange?: (isLoading: boolean) => void
  SearchInputComponent?: React.ComponentType<SearchInputProps>
  /** Optional: test ID for the search input (e.g. PortfolioNftsSearchInput) */
  searchInputTestId?: string
  /** Optional: test ID for the header (e.g. PortfolioNftsHeader) */
  headerTestId?: string
  /** Optional: test ID for the no-results message (e.g. PortfolioNftsNoResults) */
  noResultsTestId?: string
  /** Optional: test ID for the default empty state when customEmptyState is not provided (e.g. PortfolioNftsEmptyState) */
  emptyStateTestId?: string
  pollInterval?: PollingInterval
  loadingSkeletonCount?: number
}

export function NftsList(_props: NftsListProps): JSX.Element {
  throw new PlatformSplitStubError('NftsList')
}

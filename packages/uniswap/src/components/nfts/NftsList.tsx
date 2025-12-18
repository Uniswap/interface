import { ComponentProps, CSSProperties } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { SharedValue } from 'react-native-reanimated'
import { AnimatedFlashList } from 'ui/src/components/AnimatedFlashList/AnimatedFlashList'
import { NftsNextFetchPolicy, SearchInputProps } from 'uniswap/src/components/nfts/types'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { NFTItem } from 'uniswap/src/features/nfts/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export type NftsListProps = Omit<
  ComponentProps<typeof AnimatedFlashList> & {
    owner: Address
    chainsFilter?: UniverseChainId[]
    footerHeight?: SharedValue<number>
    isExternalProfile?: boolean
    renderedInModal?: boolean
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
    /** Optional: search string to filter NFTs by name, collection, token ID, or contract address */
    searchString?: string
    /** Optional: callback to receive filtered counts (shown and hidden) */
    onFilteredCountsChange?: (params: { shown: number; hidden: number }) => void
    /** Optional: custom render function for the ExpandoRow component */
    renderExpandoRow?: (props: { isExpanded: boolean; label: string; onPress: () => void }) => JSX.Element
    /** Optional: nextFetchPolicy to pass to the useNftListRenderData hook */
    nextFetchPolicy?: NftsNextFetchPolicy
    /** Optional: callback to receive the refetch function */
    onRefetchReady?: (refetch: () => void) => void
    /** Optional: callback to receive the loading state */
    onLoadingStateChange?: (isLoading: boolean) => void
    /** Optional: show header with count and refresh button */
    showHeader?: boolean
    SearchInputComponent?: React.ComponentType<SearchInputProps>
    pollInterval?: PollingInterval
  },
  'renderItem' | 'data'
> & {
  loadingSkeletonCount?: number
}

export function NftsList(_props: NftsListProps): JSX.Element {
  throw new PlatformSplitStubError('NftsList')
}

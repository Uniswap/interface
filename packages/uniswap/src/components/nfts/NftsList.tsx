import { ComponentProps, CSSProperties } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { SharedValue } from 'react-native-reanimated'
import { AnimatedFlashList } from 'ui/src/components/AnimatedFlashList/AnimatedFlashList'
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
  },
  'renderItem' | 'data'
> & {
  loadingSkeletonCount?: number
}

export function NftsList(_props: NftsListProps): JSX.Element {
  throw new PlatformSplitStubError('NftsList')
}

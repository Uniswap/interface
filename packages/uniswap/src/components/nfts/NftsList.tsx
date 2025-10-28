import { ComponentProps, CSSProperties } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { SharedValue } from 'react-native-reanimated'
import { AnimatedFlashList } from 'ui/src/components/AnimatedFlashList/AnimatedFlashList'
import { NFTItem } from 'uniswap/src/features/nfts/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export type NftsListProps = Omit<
  ComponentProps<typeof AnimatedFlashList> & {
    owner: Address
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
  },
  'renderItem' | 'data'
> & {
  loadingSkeletonCount?: number
}

export function NftsList(_props: NftsListProps): JSX.Element {
  throw new PlatformSplitStubError('NftsList')
}

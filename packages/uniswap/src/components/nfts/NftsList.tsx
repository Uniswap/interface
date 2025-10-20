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
  },
  'renderItem' | 'data'
>

export function NftsList(_props: NftsListProps): JSX.Element {
  throw new PlatformSplitStubError('NftsList')
}

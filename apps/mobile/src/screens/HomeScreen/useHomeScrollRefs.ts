import { FlashList } from '@shopify/flash-list'
import { useCallback } from 'react'
import { FlatList } from 'react-native'
import { useAnimatedRef, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'
import { TokenBalanceListRow } from 'uniswap/src/features/portfolio/types'

// biome-ignore lint/suspicious/noExplicitAny: Generic type needed for scroll ref
type FlashListAnyType = FlashList<any>
// biome-ignore lint/suspicious/noExplicitAny: Generic type needed for scroll ref
type FlatListAnyType = FlatList<any>
type ScrollRefType = FlashListAnyType | FlatListAnyType

interface ScrollRefs {
  tokensTabScrollValue: ReturnType<typeof useSharedValue<number>>
  nftsTabScrollValue: ReturnType<typeof useSharedValue<number>>
  activityTabScrollValue: ReturnType<typeof useSharedValue<number>>
  exploreTabScrollValue: ReturnType<typeof useSharedValue<number>>

  tokensTabScrollHandler: ReturnType<typeof useAnimatedScrollHandler>
  nftsTabScrollHandler: ReturnType<typeof useAnimatedScrollHandler>
  activityTabScrollHandler: ReturnType<typeof useAnimatedScrollHandler>
  exploreTabScrollHandler: ReturnType<typeof useAnimatedScrollHandler>

  tokensTabScrollRef: ReturnType<typeof useAnimatedRef<FlatList<TokenBalanceListRow>>>
  nftsTabScrollRef: ReturnType<typeof useAnimatedRef<FlashListAnyType>>
  activityTabScrollRef: ReturnType<typeof useAnimatedRef<FlatListAnyType>>
  exploreTabScrollRef: ReturnType<typeof useAnimatedRef<FlatListAnyType>>

  resetScrollState: () => void
}

/**
 * Helper function to create the same scroll ref for all tabs
 */
const useCreateScrollRef = <T extends ScrollRefType>(): {
  scrollValue: ReturnType<typeof useSharedValue<number>>
  scrollRef: ReturnType<typeof useAnimatedRef<T>>
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>
} => {
  const scrollValue = useSharedValue(0)
  const scrollRef = useAnimatedRef<T>()
  const scrollHandler = useAnimatedScrollHandler((event) => (scrollValue.value = event.contentOffset.y), [scrollValue])
  return { scrollValue, scrollRef, scrollHandler }
}

/**
 * This hook manages the creation of all the scroll refs for the home screen
 * as well as provide any scroll related actions such as resetting the scroll state
 */
export function useHomeScrollRefs(): ScrollRefs {
  const tokensTabScrollRef = useCreateScrollRef<FlatList<TokenBalanceListRow>>()
  const nftsTabScrollRef = useCreateScrollRef<FlashListAnyType>()
  const activityTabScrollRef = useCreateScrollRef<FlatListAnyType>()
  const exploreTabScrollRef = useCreateScrollRef<FlatListAnyType>()

  const resetScrollState = useCallback(() => {
    tokensTabScrollRef.scrollValue.value = 0
    nftsTabScrollRef.scrollValue.value = 0
    activityTabScrollRef.scrollValue.value = 0
    exploreTabScrollRef.scrollValue.value = 0
    tokensTabScrollRef.scrollRef.current?.scrollToOffset({ offset: 0, animated: true })
    nftsTabScrollRef.scrollRef.current?.scrollToOffset({ offset: 0, animated: true })
    activityTabScrollRef.scrollRef.current?.scrollToOffset({ offset: 0, animated: true })
    exploreTabScrollRef.scrollRef.current?.scrollToOffset({ offset: 0, animated: true })
  }, [
    tokensTabScrollRef.scrollValue,
    nftsTabScrollRef.scrollValue,
    activityTabScrollRef.scrollValue,
    exploreTabScrollRef.scrollValue,
    tokensTabScrollRef.scrollRef,
    nftsTabScrollRef.scrollRef,
    activityTabScrollRef.scrollRef,
    exploreTabScrollRef.scrollRef,
  ])

  return {
    tokensTabScrollValue: tokensTabScrollRef.scrollValue,
    tokensTabScrollHandler: tokensTabScrollRef.scrollHandler,
    tokensTabScrollRef: tokensTabScrollRef.scrollRef,

    nftsTabScrollValue: nftsTabScrollRef.scrollValue,
    nftsTabScrollHandler: nftsTabScrollRef.scrollHandler,
    nftsTabScrollRef: nftsTabScrollRef.scrollRef,

    activityTabScrollValue: activityTabScrollRef.scrollValue,
    activityTabScrollHandler: activityTabScrollRef.scrollHandler,
    activityTabScrollRef: activityTabScrollRef.scrollRef,

    exploreTabScrollValue: exploreTabScrollRef.scrollValue,
    exploreTabScrollHandler: exploreTabScrollRef.scrollHandler,
    exploreTabScrollRef: exploreTabScrollRef.scrollRef,

    resetScrollState,
  }
}

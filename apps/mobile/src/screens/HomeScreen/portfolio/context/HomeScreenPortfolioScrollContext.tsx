import { useScrollToTop } from '@react-navigation/native'
import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from 'react'
import type { FlatList, NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { useAnimatedRef, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'
import type { FeedListRow } from 'src/screens/HomeScreen/portfolio/types'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

// oxlint-disable-next-line typescript/no-explicit-any -- Generic type needed for scroll ref
type FlatListAnyType = FlatList<any>

interface HomeScreenPortfolioScrollContextValue {
  feedScrollValue: ReturnType<typeof useSharedValue<number>>
  feedScrollHandler: (e: NativeSyntheticEvent<NativeScrollEvent>) => void
  feedScrollRef: ReturnType<typeof useAnimatedRef<FlatListAnyType>>
}

const HomeScreenPortfolioScrollContext = createContext<HomeScreenPortfolioScrollContextValue | null>(null)

export function useHomeScreenPortfolioScroll(): HomeScreenPortfolioScrollContextValue {
  const context = useContext(HomeScreenPortfolioScrollContext)
  if (!context) {
    throw new Error('useHomeScreenPortfolioScroll must be used within HomeScreenPortfolioScrollProvider')
  }
  return context
}

interface HomeScreenPortfolioScrollProviderProps {
  children: ReactNode
}

/**
 * Scroll refs for the wallet home feed FlatList (portfolio header + tabs + tab body).
 * Also wires React Navigation scroll-to-top and resets scroll when the active account changes.
 */
export function HomeScreenPortfolioScrollProvider({ children }: HomeScreenPortfolioScrollProviderProps): JSX.Element {
  const { address: accountAddress } = useActiveAccountWithThrow()
  const scrollValue = useSharedValue(0)
  const scrollRef = useAnimatedRef<FlatList<FeedListRow>>()
  const scrollHandler = useAnimatedScrollHandler(
    (event) => {
      scrollValue.value = event.contentOffset.y
    },
    [scrollValue],
  )

  const resetScrollState = useCallback(() => {
    scrollValue.value = 0
    scrollRef.current?.scrollToOffset({ offset: 0, animated: true })
  }, [scrollValue, scrollRef])

  useEffect(() => {
    resetScrollState()
  }, [accountAddress, resetScrollState])

  const homeScrollToTopRef = useRef<{ scrollToTop: () => void }>({
    scrollToTop: () => {},
  })

  useEffect(() => {
    homeScrollToTopRef.current.scrollToTop = (): void => {
      scrollRef.current?.scrollToOffset({ offset: 0, animated: true })
    }
  }, [scrollRef])

  useScrollToTop(homeScrollToTopRef)

  const value: HomeScreenPortfolioScrollContextValue = {
    feedScrollValue: scrollValue,
    feedScrollHandler: scrollHandler,
    feedScrollRef: scrollRef,
  }

  return <HomeScreenPortfolioScrollContext.Provider value={value}>{children}</HomeScreenPortfolioScrollContext.Provider>
}

import type { RouteProp } from '@react-navigation/native'
import { useIsFocused, useNavigation, useRoute, useScrollToTop } from '@react-navigation/native'
import { SharedEventName } from '@uniswap/analytics-events'
import { isAndroid } from '@universe/environment'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type ScrollView, type TextInput } from 'react-native'
import { useAnimatedRef } from 'react-native-reanimated'
import type { Edge } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import type { ExploreStackParamList } from 'src/app/navigation/types'
import { ExploreSections } from 'src/components/explore/ExploreSections/ExploreSections'
import { ExploreScreenSearchResultsList } from 'src/components/explore/search/ExploreScreenSearchResultsList'
import { Screen } from 'src/components/layout/Screen'
import { Flex, useLayoutAnimationOnChange } from 'ui/src'
import { useBottomSheetContext } from 'uniswap/src/components/modals/BottomSheetContext'
import { NetworkFilter, type NetworkFilterProps } from 'uniswap/src/components/network/NetworkFilter'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useFilterCallbacks } from 'uniswap/src/features/search/SearchModal/hooks/useFilterCallbacks'
import { CancelBehaviorType, SearchTextInput } from 'uniswap/src/features/search/SearchTextInput'
import { MobileEventName, ModalName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { useEvent } from 'utilities/src/react/hooks'
import { setHasUsedExplore } from 'wallet/src/features/behaviorHistory/slice'

// From design to avoid layout thrash as icons show and hide
const MIN_SEARCH_INPUT_HEIGHT = 52

const androidBottomInset: Edge[] = isAndroid ? ['bottom'] : []
const edges: Edge[] = ['top', ...androidBottomInset]

const networkFilterStyles: NetworkFilterProps['styles'] = { buttonPaddingY: '$none' }

export function ExploreScreen(): JSX.Element {
  const { chains } = useEnabledChains()
  const navigation = useNavigation()
  const route = useRoute<RouteProp<ExploreStackParamList, MobileScreens.Explore>>()
  // oxlint-disable-next-line typescript/no-unnecessary-condition -- route.params can be null
  const { chainId, orderByMetric, showFavorites } = route.params ?? {}

  const { isSheetReady } = useBottomSheetContext({ forceSafeReturn: true })

  const dispatch = useDispatch()
  const { t } = useTranslation()

  const textInputRef = useRef<TextInput>(null)
  const listRef = useAnimatedRef<ScrollView>()
  const exploreScrollToTopRef = useRef<(() => void) | null>(null)
  const isFocused = useIsFocused()

  const [isAtTop, setIsAtTop] = useState<boolean>(true)

  // Use refs to avoid stale closures in the event listener
  const isAtTopRef = useRef(isAtTop)
  const isFocusedRef = useRef(isFocused)
  // Track the previous route name to detect true double-tap behavior
  const prevRouteNameRef = useRef<string | null>(null)

  isAtTopRef.current = isAtTop
  isFocusedRef.current = isFocused

  // Disable default scroll-to-top behavior when bottom tabs are enabled
  // We'll implement custom behavior that focuses search input if already at top
  useScrollToTop({ current: null })

  const [isSearchMode, setIsSearchMode] = useState<boolean>(false)

  useLayoutAnimationOnChange(isSearchMode, {
    duration: 125,
  })

  // Custom tab press handler for double-tap behavior on the Explore tab
  useEffect((): (() => void) | undefined => {
    const unsubscribe = navigation.addListener('state', (e) => {
      const currentRouteName = e.data.state.routeNames[e.data.state.index] as unknown as string | undefined
      const isOnExploreScreen = currentRouteName === MobileScreens.Explore

      // Double-tap detection: Only trigger focus when user taps Explore tab while already on Explore
      // This distinguishes between:
      // - Initial navigation to Explore (prevRoute !== Explore) → No auto-focus
      // - Tab double-tap (prevRoute === Explore && currentRoute === Explore) → Focus search
      const isDoubleTap = prevRouteNameRef.current === MobileScreens.Explore && isOnExploreScreen

      // Update the previous route for next navigation event
      prevRouteNameRef.current = currentRouteName ?? null

      // Only handle double-tap behavior when:
      // 1. This is a true double-tap (was on Explore, tapped Explore again)
      // 2. The screen is currently focused
      if (!isDoubleTap || !isFocusedRef.current) {
        return
      }

      // Double-tap behavior: Focus search if at top, scroll to top otherwise
      if (isAtTopRef.current) {
        textInputRef.current?.focus()
      } else {
        // If not at top, scroll to top
        exploreScrollToTopRef.current?.()
      }
    })

    return unsubscribe
  }, [navigation])

  // TODO(WALL-5482): investigate list rendering performance/scrolling issue
  const canRenderList = useRenderNextFrame(isSheetReady)

  const { onChangeChainFilter, onChangeText, searchFilter, chainFilter, parsedChainFilter, parsedSearchFilter } =
    useFilterCallbacks(chainId ?? null, ModalName.Search)

  const onSearchChangeText = useEvent((newSearchFilter: string): void => {
    onChangeText(newSearchFilter)
    // Keep the state of the search input after changing theme
    textInputRef.current?.setNativeProps({ text: newSearchFilter })
  })

  const onSearchFocus = useEvent((): void => {
    setIsSearchMode(true)
    sendAnalyticsEvent(SharedEventName.PAGE_VIEWED, {
      section: SectionName.ExploreSearch,
      screen: MobileScreens.Explore,
    })
  })

  const onSearchCancel = useEvent((): void => {
    setIsSearchMode(false)
  })

  const onPressChain = useEvent((newChainId: UniverseChainId | null): void => {
    sendAnalyticsEvent(MobileEventName.ExploreSearchNetworkSelected, {
      networkChainId: newChainId ?? 'all',
    })

    onChangeChainFilter(newChainId)
  })

  useEffect(() => {
    dispatch(setHasUsedExplore(true))
  }, [dispatch])

  return (
    <Screen backgroundColor="$surface1" edges={edges}>
      <Flex p="$spacing16">
        <SearchTextInput
          ref={textInputRef}
          autoFocus={false}
          cancelBehaviorType={CancelBehaviorType.BackChevron}
          endAdornment={
            isSearchMode ? (
              <Flex row alignItems="center" animateEnterExit="fadeInDownOutUp">
                <NetworkFilter
                  includeAllNetworks
                  chainIds={chains}
                  selectedChain={chainFilter}
                  styles={networkFilterStyles}
                  onPressChain={onPressChain}
                />
              </Flex>
            ) : null
          }
          hideIcon={isSearchMode}
          minHeight={MIN_SEARCH_INPUT_HEIGHT}
          placeholder={t('explore.search.placeholder')}
          borderColor="$transparent"
          borderWidth="$none"
          onCancel={onSearchCancel}
          onChangeText={onSearchChangeText}
          onFocus={onSearchFocus}
        />
      </Flex>
      {isSearchMode ? (
        <ExploreScreenSearchResultsList
          searchQuery={searchFilter ?? ''}
          parsedSearchQuery={parsedSearchFilter}
          chainFilter={chainFilter}
          parsedChainFilter={parsedChainFilter}
        />
      ) : isSheetReady && canRenderList ? (
        <ExploreSections
          listRef={listRef}
          setIsAtTopOnScroll={setIsAtTop}
          chainId={chainId}
          orderByMetric={orderByMetric}
          showFavorites={showFavorites}
          onScrollToTopReady={(scrollToTop): void => {
            exploreScrollToTopRef.current = scrollToTop
          }}
        />
      ) : null}
    </Screen>
  )
}

/**
 * A hook that safely handles mounting/unmounting using requestAnimationFrame.
 * This can help prevent common React Native issues with rendering and gestures
 * by ensuring elements mount on the next frame. (not ideal, but better than nothing)
 */
const useRenderNextFrame = (condition: boolean): boolean => {
  const [canRender, setCanRender] = useState<boolean>(false)
  const rafRef = useRef<number>(undefined)
  const conditionRef = useRef<boolean>(condition)

  // schedule render for next frame if we should mount.
  // The cleanup cancels the RAF on real unmount, so the callback can't fire after
  // unmount — no separate `mountedRef` guard is needed (and a `mountedRef` set
  // only by the cleanup is broken under React 19 strict-mode dev double-invocation:
  // the simulated unmount sets it to false and the simulated remount never resets
  // it, so `setCanRender(true)` is never called).
  useEffect(() => {
    conditionRef.current = condition

    if (condition) {
      rafRef.current = requestAnimationFrame(() => {
        // By the time this callback runs, 'condition' might have changed
        // since RAF executes in the next frame, so we store the condition in a ref
        if (conditionRef.current) {
          setCanRender(true)
        }
      })
    } else {
      setCanRender(false)
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [condition])

  return canRender
}

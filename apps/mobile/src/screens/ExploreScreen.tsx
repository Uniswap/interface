import { useIsFocused, useNavigation, useScrollToTop } from '@react-navigation/native'
import { SharedEventName } from '@uniswap/analytics-events'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type TextInput } from 'react-native'
import type { FlatList } from 'react-native-gesture-handler'
import { useAnimatedRef } from 'react-native-reanimated'
import type { Edge } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { ExploreSections } from 'src/components/explore/ExploreSections/ExploreSections'
import { ExploreScreenSearchResultsList } from 'src/components/explore/search/ExploreScreenSearchResultsList'
import { Screen } from 'src/components/layout/Screen'
import { Flex, useLayoutAnimationOnChange } from 'ui/src'
import { useBottomSheetContext } from 'uniswap/src/components/modals/BottomSheetContext'
import { HandleBar } from 'uniswap/src/components/modals/HandleBar'
import { NetworkFilter, type NetworkFilterProps } from 'uniswap/src/components/network/NetworkFilter'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useFilterCallbacks } from 'uniswap/src/features/search/SearchModal/hooks/useFilterCallbacks'
import { CancelBehaviorType, SearchTextInput } from 'uniswap/src/features/search/SearchTextInput'
import { MobileEventName, ModalName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { isAndroid } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'
import { setHasUsedExplore } from 'wallet/src/features/behaviorHistory/slice'

// From design to avoid layout thrash as icons show and hide
const MIN_SEARCH_INPUT_HEIGHT = 52

const androidBottomInset: Edge[] = isAndroid ? ['bottom'] : []
const edges: Edge[] = ['top', ...androidBottomInset]

const networkFilterStyles: NetworkFilterProps['styles'] = { buttonPaddingY: '$none' }

export function ExploreScreen(): JSX.Element {
  const { chains } = useEnabledChains()
  const isBottomTabsEnabled = useFeatureFlag(FeatureFlags.BottomTabs)
  const navigation = useNavigation()

  const { isSheetReady } = useBottomSheetContext({ forceSafeReturn: isBottomTabsEnabled })

  const dispatch = useDispatch()
  const { t } = useTranslation()

  const textInputRef = useRef<TextInput>(null)
  const listRef = useAnimatedRef<FlatList<unknown>>()
  const isFocused = useIsFocused()

  const [isAtTop, setIsAtTop] = useState<boolean>(true)

  // Use refs to avoid stale closures in the event listener
  const isAtTopRef = useRef(isAtTop)
  const isFocusedRef = useRef(isFocused)

  isAtTopRef.current = isAtTop
  isFocusedRef.current = isFocused

  // Disable default scroll-to-top behavior when bottom tabs are enabled
  // We'll implement custom behavior that focuses search input if already at top
  useScrollToTop(isBottomTabsEnabled ? { current: null } : listRef)

  const [isSearchMode, setIsSearchMode] = useState<boolean>(false)

  useLayoutAnimationOnChange(isSearchMode, {
    duration: 125,
  })

  // Custom tab press handler for double-tap behavior (only when bottom tabs enabled)
  // This effect only runs when isBottomTabsEnabled or navigation changes
  useEffect((): (() => void) | undefined => {
    if (!isBottomTabsEnabled) {
      return undefined
    }

    const unsubscribe = navigation.addListener('state', (e) => {
      const currentRouteName = e.data.state.routeNames[e.data.state.index] as unknown as string | undefined

      // Check if we're navigating to the Explore screen
      const isOnExploreScreen = currentRouteName === MobileScreens.Explore

      // Only handle this if:
      // 1. We were already focused before the state change (i.e., tab was pressed while already on this screen)
      // 2. The current route is the Explore screen
      // 3. The screen is currently focused
      if (!isOnExploreScreen || !isFocusedRef.current) {
        return
      }

      if (isAtTopRef.current) {
        textInputRef.current?.focus()
      } else {
        // If not at top, scroll to top
        listRef.current?.scrollToOffset({ offset: 0, animated: true })
      }
    })

    return unsubscribe
  }, [isBottomTabsEnabled, navigation])

  // TODO(WALL-5482): investigate list rendering performance/scrolling issue
  const canRenderList = useRenderNextFrame(isSheetReady && !isSearchMode)

  const { onChangeChainFilter, onChangeText, searchFilter, chainFilter, parsedChainFilter, parsedSearchFilter } =
    useFilterCallbacks(null, ModalName.Search)

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
    // Moved location of this event only in bottom tab mode
    if (isBottomTabsEnabled) {
      dispatch(setHasUsedExplore(true))
    }
  }, [dispatch, isBottomTabsEnabled])

  return (
    <Screen backgroundColor="$surface1" edges={edges}>
      {!isBottomTabsEnabled && <HandleBar backgroundColor="none" />}
      <Flex p="$spacing16">
        <SearchTextInput
          ref={textInputRef}
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
        <ExploreSections listRef={listRef} setIsAtTopOnScroll={isBottomTabsEnabled ? setIsAtTop : undefined} />
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
  const rafRef = useRef<number>()
  const mountedRef = useRef<boolean>(true)

  const conditionRef = useRef<boolean>(condition)

  // clean up on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  // schedule render for next frame if we should mount
  useEffect(() => {
    conditionRef.current = condition

    if (condition) {
      rafRef.current = requestAnimationFrame(() => {
        // By the time this callback runs, 'condition' might have changed
        // since RAF executes in the next frame, so we store the condition in a ref
        if (mountedRef.current && conditionRef.current) {
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

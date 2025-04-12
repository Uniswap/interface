import { useScrollToTop } from '@react-navigation/native'
import { SharedEventName } from '@uniswap/analytics-events'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, TextInput } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { useAnimatedRef } from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import { useExploreStackNavigation } from 'src/app/navigation/types'
import { ExploreSections } from 'src/components/explore/ExploreSections'
import { SearchEmptySection } from 'src/components/explore/search/SearchEmptySection'
import { SearchResultsSection } from 'src/components/explore/search/SearchResultsSection'
import { Screen } from 'src/components/layout/Screen'
import { selectModalState } from 'src/features/modals/selectModalState'
import { Flex, flexStyles } from 'ui/src'
import { useBottomSheetContext } from 'uniswap/src/components/modals/BottomSheetContext'
import { HandleBar } from 'uniswap/src/components/modals/HandleBar'
import { NetworkFilter } from 'uniswap/src/components/network/NetworkFilter'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { SearchModalNoQueryList } from 'uniswap/src/features/search/SearchModal/SearchModalNoQueryList'
import { SearchModalResultsList } from 'uniswap/src/features/search/SearchModal/SearchModalResultsList'
import { CancelBehaviorType, SearchTextInput } from 'uniswap/src/features/search/SearchTextInput'
import { MobileEventName, ModalName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard'
import { useDebounce } from 'utilities/src/time/timing'

// From design to avoid layout thrash as icons show and hide
const MIN_SEARCH_INPUT_HEIGHT = 52

export function ExploreScreen(): JSX.Element {
  const modalInitialState = useSelector(selectModalState(ModalName.Explore)).initialState
  const navigation = useExploreStackNavigation()
  const { chains } = useEnabledChains()

  const { isSheetReady } = useBottomSheetContext()

  // The ExploreStack is not directly accessible from outside
  // (e.g., navigating from Home to NFTItem within ExploreStack), due to its mount within Modal.
  // To bypass this limitation, we use an initialState to define a specific screen within ExploreStack.
  useEffect(() => {
    if (modalInitialState) {
      navigation.navigate(modalInitialState.screen, modalInitialState.params)
    }
  }, [modalInitialState, navigation])

  const { t } = useTranslation()

  const listRef = useAnimatedRef<FlatList>()
  useScrollToTop(listRef)

  const searchRevampEnabled = useFeatureFlag(FeatureFlags.SearchRevamp)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const debouncedSearchQuery = useDebounce(searchQuery).trim()
  const [isSearchMode, setIsSearchMode] = useState<boolean>(false)
  const textInputRef = useRef<TextInput>(null)
  const [selectedChain, setSelectedChain] = useState<UniverseChainId | null>(null)
  // TODO(WALL-5482): investigate list rendering performance/scrolling issue
  const canRenderList = useRenderNextFrame(!isSearchMode)

  const onSearchChangeText = (newSearchFilter: string): void => {
    setSearchQuery(newSearchFilter)
  }

  const onSearchFocus = (): void => {
    setIsSearchMode(true)
    sendAnalyticsEvent(SharedEventName.PAGE_VIEWED, {
      section: SectionName.ExploreSearch,
      screen: MobileScreens.Explore,
    })
  }

  const onSearchCancel = (): void => {
    setIsSearchMode(false)
  }

  const onScroll = useCallback(() => {
    textInputRef.current?.blur()
  }, [])

  return (
    <Screen backgroundColor="$surface1" edges={['top']}>
      <HandleBar backgroundColor="none" />
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
                  selectedChain={selectedChain}
                  styles={{ buttonPaddingY: '$none' }}
                  onDismiss={dismissNativeKeyboard}
                  onPressChain={(newChainId) => {
                    sendAnalyticsEvent(MobileEventName.ExploreSearchNetworkSelected, {
                      networkChainId: newChainId ?? 'all',
                    })

                    setSelectedChain(newChainId)
                  }}
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
        <KeyboardAvoidingView behavior="height" style={flexStyles.fill}>
          <Flex p="$spacing4" />
          {searchRevampEnabled ? (
            // TODO(WEB-6768): integrate SearchModalList into mobile ExploreScreen
            searchQuery && searchQuery.length > 0 ? (
              <SearchModalResultsList
                chainFilter={selectedChain}
                debouncedParsedSearchFilter={debouncedSearchQuery}
                debouncedSearchFilter={debouncedSearchQuery}
                parsedChainFilter={selectedChain}
                searchFilter={searchQuery ?? ''}
                onSelectCurrency={() => {}}
              />
            ) : (
              <SearchModalNoQueryList chainFilter={selectedChain} onSelectCurrency={() => {}} />
            )
          ) : debouncedSearchQuery.length === 0 ? (
            // Mimic ScrollView behavior with FlatList
            // Needs to be from gesture handler to work on android within BottomSheelModal
            <FlatList
              ListHeaderComponent={<SearchEmptySection selectedChain={selectedChain} />}
              data={[]}
              keyExtractor={(): string => 'search-empty-section-container'}
              keyboardShouldPersistTaps="always"
              renderItem={null}
              scrollEventThrottle={16}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              onScroll={onScroll}
            />
          ) : (
            <SearchResultsSection searchQuery={debouncedSearchQuery} selectedChain={selectedChain} />
          )}
        </KeyboardAvoidingView>
      ) : (
        isSheetReady && canRenderList && <ExploreSections listRef={listRef} />
      )}
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

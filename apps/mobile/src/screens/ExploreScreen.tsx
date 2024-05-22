import { useScrollToTop } from '@react-navigation/native'
import { SharedEventName } from '@uniswap/analytics-events'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, TextInput } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppSelector } from 'src/app/hooks'
import { useExploreStackNavigation } from 'src/app/navigation/types'
import { ExploreSections } from 'src/components/explore/ExploreSections'
import { SearchEmptySection } from 'src/components/explore/search/SearchEmptySection'
import { SearchResultsSection } from 'src/components/explore/search/SearchResultsSection'
import { Screen } from 'src/components/layout/Screen'
import { VirtualizedList } from 'src/components/layout/VirtualizedList'
import { useReduxModalBackHandler } from 'src/features/modals/hooks'
import { selectModalState } from 'src/features/modals/selectModalState'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { Screens } from 'src/screens/Screens'
import { AnimatedFlex, ColorTokens, Flex, flexStyles, useIsDarkMode } from 'ui/src'
import { useDebounce } from 'utilities/src/time/timing'
import { useBottomSheetContext } from 'wallet/src/components/modals/BottomSheetContext'
import { HandleBar } from 'wallet/src/components/modals/HandleBar'
import { SearchTextInput } from 'wallet/src/features/search/SearchTextInput'
import { ModalName, SectionName } from 'wallet/src/telemetry/constants'

export function ExploreScreen(): JSX.Element {
  const modalInitialState = useAppSelector(selectModalState(ModalName.Explore)).initialState
  const navigation = useExploreStackNavigation()

  const { isSheetReady } = useBottomSheetContext()

  useReduxModalBackHandler(ModalName.Explore)

  // The ExploreStack is not directly accessible from outside
  // (e.g., navigating from Home to NFTItem within ExploreStack), due to its mount within BottomSheetModal.
  // To bypass this limitation, we use an initialState to define a specific screen within ExploreStack.
  useEffect(() => {
    if (modalInitialState) {
      navigation.navigate(modalInitialState.screen, modalInitialState.params)
    }
  }, [modalInitialState, navigation])

  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()

  const listRef = useRef(null)
  useScrollToTop(listRef)

  const [searchQuery, setSearchQuery] = useState<string>('')
  const debouncedSearchQuery = useDebounce(searchQuery).trim()
  const [isSearchMode, setIsSearchMode] = useState<boolean>(false)
  const textInputRef = useRef<TextInput>(null)

  const onSearchChangeText = (newSearchFilter: string): void => {
    setSearchQuery(newSearchFilter)
  }

  const onSearchFocus = (): void => {
    setIsSearchMode(true)
    sendMobileAnalyticsEvent(SharedEventName.PAGE_VIEWED, {
      section: SectionName.ExploreSearch,
      screen: Screens.Explore,
    })
  }

  const onSearchCancel = (): void => {
    setIsSearchMode(false)
  }

  // Handle special case with design system light colors because surface2 is the same as surface1
  const contrastBackgroundColor: ColorTokens = isDarkMode ? '$DEP_backgroundOverlay' : '$surface1'
  const searchBarBackgroundColor: ColorTokens = isDarkMode ? '$DEP_backgroundOverlay' : '$surface1'

  const onScroll = useCallback(() => {
    textInputRef.current?.blur()
  }, [])

  return (
    <Screen backgroundColor="$transparent" edges={['top']}>
      <HandleBar backgroundColor="none" />
      <Flex backgroundColor="$transparent" p="$spacing16">
        <SearchTextInput
          ref={textInputRef}
          backgroundColor={isSearchMode ? contrastBackgroundColor : searchBarBackgroundColor}
          placeholder={t('explore.search.placeholder')}
          showShadow={!isSearchMode}
          onCancel={onSearchCancel}
          onChangeText={onSearchChangeText}
          onFocus={onSearchFocus}
        />
      </Flex>
      {isSearchMode ? (
        <KeyboardAvoidingView behavior="height" style={flexStyles.fill}>
          <Flex grow mx="$spacing16">
            <VirtualizedList onScroll={onScroll}>
              <Flex p="$spacing4" />
              {debouncedSearchQuery.length === 0 ? (
                <SearchEmptySection />
              ) : (
                <AnimatedFlex entering={FadeIn} exiting={FadeOut}>
                  <SearchResultsSection searchQuery={debouncedSearchQuery} />
                </AnimatedFlex>
              )}
            </VirtualizedList>
          </Flex>
        </KeyboardAvoidingView>
      ) : (
        isSheetReady && <ExploreSections listRef={listRef} />
      )}
    </Screen>
  )
}

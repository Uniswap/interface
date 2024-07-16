import { useScrollToTop } from '@react-navigation/native'
import { SharedEventName } from '@uniswap/analytics-events'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, KeyboardAvoidingView, TextInput } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppSelector } from 'src/app/hooks'
import { useExploreStackNavigation } from 'src/app/navigation/types'
import { ExploreSections } from 'src/components/explore/ExploreSections'
import { SearchEmptySection } from 'src/components/explore/search/SearchEmptySection'
import { SearchResultsSection } from 'src/components/explore/search/SearchResultsSection'
import { Screen } from 'src/components/layout/Screen'
import { VirtualizedList } from 'src/components/layout/VirtualizedList'
import { selectModalState } from 'src/features/modals/selectModalState'
import { ColorTokens, Flex, flexStyles, useIsDarkMode } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { useBottomSheetContext } from 'uniswap/src/components/modals/BottomSheetContext'
import { HandleBar } from 'uniswap/src/components/modals/HandleBar'
import { SearchTextInput } from 'uniswap/src/features/search/SearchTextInput'
import { ModalName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { useDebounce } from 'utilities/src/time/timing'

export function ExploreScreen(): JSX.Element {
  const modalInitialState = useAppSelector(selectModalState(ModalName.Explore)).initialState
  const navigation = useExploreStackNavigation()

  const { isSheetReady } = useBottomSheetContext()

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
    sendAnalyticsEvent(SharedEventName.PAGE_VIEWED, {
      section: SectionName.ExploreSearch,
      screen: MobileScreens.Explore,
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
          onDismiss={() => Keyboard.dismiss()}
          onFocus={onSearchFocus}
        />
      </Flex>
      {isSearchMode ? (
        <KeyboardAvoidingView behavior="height" style={flexStyles.fill}>
          <Flex grow>
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

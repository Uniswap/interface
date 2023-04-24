import { useScrollToTop } from '@react-navigation/native'
import { SharedEventName } from '@uniswap/analytics-events'
import React, { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, TextInput } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { ExploreSections } from 'src/components/explore/ExploreSections'
import { SearchEmptySection } from 'src/components/explore/search/SearchEmptySection'
import { SearchResultsSection } from 'src/components/explore/search/SearchResultsSection'
import { SearchTextInput } from 'src/components/input/SearchTextInput'
import { AnimatedFlex, Box, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { VirtualizedList } from 'src/components/layout/VirtualizedList'
import { HandleBar } from 'src/components/modals/HandleBar'
import { useIsDarkMode } from 'src/features/appearance/hooks'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import { SectionName } from 'src/features/telemetry/constants'
import { Screens } from 'src/screens/Screens'
import { flex } from 'src/styles/flex'
import { Theme } from 'src/styles/theme'
import { useDebounce } from 'src/utils/timing'

export function ExploreScreen(): JSX.Element {
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()

  const listRef = useRef(null)
  useScrollToTop(listRef)

  const [searchQuery, setSearchQuery] = useState<string>('')
  const debouncedSearchQuery = useDebounce(searchQuery)
  const [isSearchMode, setIsSearchMode] = useState<boolean>(false)
  const textInputRef = useRef<TextInput>(null)

  const onChangeSearchFilter = (newSearchFilter: string): void => {
    setSearchQuery(newSearchFilter)
  }

  const onSearchFocus = (): void => {
    setIsSearchMode(true)
    sendAnalyticsEvent(SharedEventName.PAGE_VIEWED, {
      section: SectionName.ExploreSearch,
      screen: Screens.Explore,
    })
  }

  const onSearchCancel = (): void => {
    setIsSearchMode(false)
  }

  // Handle special case with design system light colors because background1 is the same as background0
  const contrastBackgroundColor: keyof Theme['colors'] = isDarkMode
    ? 'backgroundOverlay'
    : 'background1'
  const searchBarBackgroundColor: keyof Theme['colors'] = isDarkMode
    ? 'backgroundOverlay'
    : 'background1'

  const onScroll = useCallback(() => {
    textInputRef.current?.blur()
  }, [])

  return (
    <Screen bg="none" edges={['top']}>
      <HandleBar backgroundColor="none" />
      <Box backgroundColor="none" p="spacing16">
        <SearchTextInput
          ref={textInputRef}
          showCancelButton
          backgroundColor={isSearchMode ? contrastBackgroundColor : searchBarBackgroundColor}
          placeholder={t('Search tokens and wallets')}
          showShadow={!isSearchMode}
          value={searchQuery}
          onCancel={onSearchCancel}
          onChangeText={onChangeSearchFilter}
          onFocus={onSearchFocus}
        />
      </Box>
      {isSearchMode ? (
        <KeyboardAvoidingView behavior="height" style={flex.fill}>
          <Flex grow mx="spacing16">
            <VirtualizedList onScroll={onScroll}>
              <Box p="spacing4" />
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
        <ExploreSections listRef={listRef} />
      )}
    </Screen>
  )
}

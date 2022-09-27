import { useScrollToTop } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { graphql } from 'babel-plugin-relay/macro'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, Route, TextInput, ViewStyle } from 'react-native'
import {
  FadeIn,
  FadeOut,
  useAnimatedScrollHandler,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { ExploreStackParamList, TabNavigationProp } from 'src/app/navigation/types'
import { SearchEmptySection } from 'src/components/explore/search/SearchEmptySection'
import { SearchResultsSection } from 'src/components/explore/search/SearchResultsSection'
import { SearchEmptySection_popularTokens$key } from 'src/components/explore/search/__generated__/SearchEmptySection_popularTokens.graphql'
import ExploreTokensTab from 'src/components/explore/tabs/ExploreTokensTab'
import ExploreWalletsTab from 'src/components/explore/tabs/ExploreWalletsTab'
import { SearchTextInput } from 'src/components/input/SearchTextInput'
import { AnimatedFlex, Box, Flex } from 'src/components/layout'
import TabbedScrollScreen, {
  TabViewScrollProps,
} from 'src/components/layout/screens/TabbedScrollScreen'
import { VirtualizedList } from 'src/components/layout/VirtualizedList'
import { Screens, Tabs } from 'src/screens/Screens'
import { ExploreScreenQuery$data } from 'src/screens/__generated__/ExploreScreenQuery.graphql'
import { flex } from 'src/styles/flex'
import { theme } from 'src/styles/theme'
import { useDebounce } from 'src/utils/timing'

const TOKENS_KEY = 'tokens'
const WALLETS_KEY = 'wallets'

// For content Y offset since Header has abolute position
const SEARCH_BAR_HEIGHT = 66
const CONTENT_MAX_SCROLL_Y = SEARCH_BAR_HEIGHT + theme.spacing.md // Scroll distance for pinned search bar state

export const exploreScreenQuery = graphql`
  query ExploreScreenQuery {
    popularTokens: topTokenProjects(orderBy: VOLUME, page: 1, pageSize: 3) {
      ...SearchEmptySection_popularTokens
    }
  }
`

type Props = { data: ExploreScreenQuery$data } & NativeStackScreenProps<
  ExploreStackParamList,
  Screens.Explore
>

export function ExploreScreen({ data, navigation }: Props) {
  const { t } = useTranslation()

  const listRef = useRef(null)
  useScrollToTop(listRef)

  const [searchQuery, setSearchQuery] = useState<string>('')
  const debouncedSearchQuery = useDebounce(searchQuery)
  const [isSearchMode, setIsSearchMode] = useState<boolean>(false)
  const scrollY = useSharedValue(0)
  const textInputRef = useRef<TextInput>(null)

  const onChangeSearchFilter = (newSearchFilter: string) => {
    setSearchQuery(newSearchFilter)
  }

  const onSearchFocus = () => {
    scrollY.value = withTiming(CONTENT_MAX_SCROLL_Y, {
      duration: 100,
    })
    setIsSearchMode(true)
  }

  const onSearchCancel = useCallback(() => {
    scrollY.value = withTiming(0, { duration: 100 })
    setIsSearchMode(false)
  }, [scrollY])

  // Reset search mode on tab press
  useEffect(() => {
    const unsubscribe = (navigation.getParent() as TabNavigationProp<Tabs.Explore>).addListener(
      'tabPress',
      () => {
        textInputRef?.current?.clear()
        onSearchCancel()
      }
    )

    return unsubscribe
  }, [navigation, onSearchCancel])

  const resultsScrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y + CONTENT_MAX_SCROLL_Y
  })

  const renderTab = useMemo(() => {
    return (route: Route, scrollProps: TabViewScrollProps, loadingContainerStyle: ViewStyle) => {
      if (isSearchMode) {
        return null
      }
      switch (route?.key) {
        case TOKENS_KEY:
          return (
            <ExploreTokensTab
              listRef={listRef}
              loadingContainerStyle={loadingContainerStyle}
              tabViewScrollProps={scrollProps}
            />
          )
        case WALLETS_KEY:
          return (
            <ExploreWalletsTab
              tabViewScrollProps={scrollProps}
              onSearchWallets={() => textInputRef.current?.focus()}
            />
          )
      }
      return null
    }
  }, [isSearchMode])

  return (
    <TabbedScrollScreen
      headerContent={
        <Box bg="backgroundBackdrop">
          <Flex m="sm">
            <SearchTextInput
              ref={textInputRef}
              showCancelButton
              backgroundColor="backgroundContainer"
              placeholder={t('Search tokens or addresses')}
              value={searchQuery}
              onCancel={onSearchCancel}
              onChangeText={onChangeSearchFilter}
              onFocus={onSearchFocus}
            />
          </Flex>
          {
            // @TODO: find more graceful way to transition in/out of search
          }
          {isSearchMode ? (
            <KeyboardAvoidingView behavior="height" style={flex.fill}>
              <AnimatedFlex grow entering={FadeIn} exiting={FadeOut} px="sm">
                <VirtualizedList onScroll={resultsScrollHandler}>
                  <Box p="xs" />
                  {searchQuery.length === 0 ? (
                    <SearchEmptySection
                      popularTokens={
                        data.popularTokens
                          ? (data.popularTokens.filter(
                              Boolean
                            ) as SearchEmptySection_popularTokens$key)
                          : null
                      }
                    />
                  ) : (
                    <SearchResultsSection searchQuery={debouncedSearchQuery} />
                  )}
                </VirtualizedList>
              </AnimatedFlex>
            </KeyboardAvoidingView>
          ) : null}
        </Box>
      }
      hideTabs={isSearchMode}
      renderTab={renderTab}
      tabs={[
        { key: TOKENS_KEY, title: t('Tokens') },
        { key: WALLETS_KEY, title: t('Wallets') },
      ]}
    />
  )
}

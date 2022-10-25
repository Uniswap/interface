import { DrawerActions, useScrollToTop } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, TextInput } from 'react-native'
import { GestureDetector } from 'react-native-gesture-handler'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { SceneRendererProps, TabBar, TabView } from 'react-native-tab-view'
import { PreloadedQuery } from 'react-relay'
import { useAppTheme } from 'src/app/hooks'
import { ExploreStackParamList, TabNavigationProp } from 'src/app/navigation/types'
import { Suspense } from 'src/components/data/Suspense'
import { SearchEmptySection } from 'src/components/explore/search/SearchEmptySection'
import { SearchResultsSection } from 'src/components/explore/search/SearchResultsSection'
import ExploreTokensTab from 'src/components/explore/tabs/ExploreTokensTab'
import ExploreWalletsTab from 'src/components/explore/tabs/ExploreWalletsTab'
import { ExploreTokensTabQuery } from 'src/components/explore/tabs/__generated__/ExploreTokensTabQuery.graphql'
import { SearchTextInput } from 'src/components/input/SearchTextInput'
import { AnimatedFlex, Box, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import {
  panHeaderGestureAction,
  panSidebarContainerGestureAction,
  renderTabLabel,
  TabStyles,
} from 'src/components/layout/screens/TabbedScrollScreen'
import { VirtualizedList } from 'src/components/layout/VirtualizedList'
import { Loading } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { Screens, Tabs } from 'src/screens/Screens'
import { flex } from 'src/styles/flex'
import { useDebounce } from 'src/utils/timing'

const TOKENS_KEY = 'tokens'
const WALLETS_KEY = 'wallets'

const SIDEBAR_SWIPE_CONTAINER_WIDTH = 45

type Props = {
  exploreTokensTabQueryRef: PreloadedQuery<ExploreTokensTabQuery>
} & NativeStackScreenProps<ExploreStackParamList, Screens.Explore>

export function ExploreScreen({ exploreTokensTabQueryRef, navigation }: Props) {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const listRef = useRef(null)
  useScrollToTop(listRef)

  const [searchQuery, setSearchQuery] = useState<string>('')
  const debouncedSearchQuery = useDebounce(searchQuery)
  const [isSearchMode, setIsSearchMode] = useState<boolean>(false)
  const textInputRef = useRef<TextInput>(null)

  const onChangeSearchFilter = (newSearchFilter: string) => {
    setSearchQuery(newSearchFilter)
  }

  const onSearchFocus = () => {
    setIsSearchMode(true)
  }

  const onSearchCancel = () => {
    setIsSearchMode(false)
  }

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
  }, [navigation])

  const tabs = useMemo(
    () => [
      { key: TOKENS_KEY, title: t('Tokens') },
      { key: WALLETS_KEY, title: t('Wallets') },
    ],
    [t]
  )
  const [tabIndex, setIndex] = useState(0)

  const renderTab = useCallback(
    ({ route }) => {
      switch (route?.key) {
        case TOKENS_KEY:
          return (
            <Suspense fallback={<ExploreTokensTabLoader />}>
              <ExploreTokensTab listRef={listRef} queryRef={exploreTokensTabQueryRef} />
            </Suspense>
          )
        case WALLETS_KEY:
          return <ExploreWalletsTab />
      }
      return null
    },
    [exploreTokensTabQueryRef, listRef]
  )

  const renderTabBar = useCallback(
    (sceneProps: SceneRendererProps) => {
      return (
        <TabBar
          {...sceneProps}
          indicatorStyle={[TabStyles.indicator]}
          navigationState={{ index: tabIndex, routes: tabs }}
          renderLabel={renderTabLabel}
          style={[TabStyles.tab, { backgroundColor: theme.colors.background0 }]}
        />
      )
    },
    [tabIndex, tabs, theme]
  )

  const openSidebar = useCallback(() => {
    navigation.dispatch(DrawerActions.openDrawer())
  }, [navigation])

  const panSidebarContainerGesture = useMemo(
    () => panSidebarContainerGestureAction(openSidebar),
    [openSidebar]
  )
  const panHeaderGesture = useMemo(() => panHeaderGestureAction(openSidebar), [openSidebar])

  return (
    <Screen edges={['top', 'left', 'right']}>
      <GestureDetector gesture={panHeaderGesture}>
        <Flex bg="background0" m="sm">
          <SearchTextInput
            ref={textInputRef}
            showCancelButton
            backgroundColor="background2"
            placeholder={t('Search tokens and wallets')}
            value={searchQuery}
            onCancel={onSearchCancel}
            onChangeText={onChangeSearchFilter}
            onFocus={onSearchFocus}
          />
        </Flex>
      </GestureDetector>
      <Flex grow>
        {isSearchMode ? (
          <KeyboardAvoidingView behavior="height" style={flex.fill}>
            <AnimatedFlex grow entering={FadeIn} exiting={FadeOut} mx="md">
              <VirtualizedList>
                <Box p="xxs" />
                {searchQuery.length === 0 ? (
                  <SearchEmptySection />
                ) : (
                  <SearchResultsSection searchQuery={debouncedSearchQuery} />
                )}
              </VirtualizedList>
            </AnimatedFlex>
          </KeyboardAvoidingView>
        ) : (
          <TabView
            navigationState={{ index: tabIndex, routes: tabs }}
            renderScene={renderTab}
            renderTabBar={renderTabBar}
            style={TabStyles.tabView}
            onIndexChange={setIndex}
          />
        )}
      </Flex>

      <GestureDetector gesture={panSidebarContainerGesture}>
        <Box
          bottom={0}
          height="100%"
          left={0}
          position="absolute"
          top={0}
          width={SIDEBAR_SWIPE_CONTAINER_WIDTH} // Roughly 1/2 icon width on tokens tab
        />
      </GestureDetector>
    </Screen>
  )
}

function ExploreTokensTabLoader() {
  const { t } = useTranslation()
  return (
    <Flex gap="md" mx="xs" my="sm">
      <Flex gap="sm">
        <Text color="textSecondary" variant="subheadSmall">
          {t('Favorites')}
        </Text>
        <Loading repeat={3} type="favorite" />
      </Flex>
      <Flex gap="sm">
        <Text color="textSecondary" variant="subheadSmall">
          {t('Top tokens')}
        </Text>
        <Loading repeat={5} type="token" />
      </Flex>
    </Flex>
  )
}

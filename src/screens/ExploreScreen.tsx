import { useScrollToTop } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, Route, TextInput } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { SceneRendererProps, TabBar, TabView } from 'react-native-tab-view'
import { useAppTheme } from 'src/app/hooks'
import { ExploreStackParamList, TabNavigationProp } from 'src/app/navigation/types'
import { SearchEmptySection } from 'src/components/explore/search/SearchEmptySection'
import { SearchResultsSection } from 'src/components/explore/search/SearchResultsSection'
import ExploreTokensTab from 'src/components/explore/tabs/ExploreTokensTab'
import ExploreWalletsTab from 'src/components/explore/tabs/ExploreWalletsTab'
import { SearchTextInput } from 'src/components/input/SearchTextInput'
import { AnimatedFlex, Box, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { renderTabLabel, TabStyles } from 'src/components/layout/screens/TabbedScrollScreen'
import { VirtualizedList } from 'src/components/layout/VirtualizedList'
import { Screens, Tabs } from 'src/screens/Screens'
import { flex } from 'src/styles/flex'
import { useDebounce } from 'src/utils/timing'

const TOKENS_KEY = 'tokens'
const WALLETS_KEY = 'wallets'

type Props = NativeStackScreenProps<ExploreStackParamList, Screens.Explore>

export function ExploreScreen({ navigation }: Props) {
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

  const tabs = [
    { key: TOKENS_KEY, title: t('Tokens') },
    { key: WALLETS_KEY, title: t('Wallets') },
  ]
  const [tabIndex, setIndex] = useState(0)

  const renderTab = (route: Route) => {
    switch (route?.key) {
      case TOKENS_KEY:
        return <ExploreTokensTab listRef={listRef} />
      case WALLETS_KEY:
        return <ExploreWalletsTab onSearchWallets={() => textInputRef.current?.focus()} />
    }
    return null
  }

  const renderTabBar = (sceneProps: SceneRendererProps) => {
    return (
      <TabBar
        {...sceneProps}
        indicatorStyle={[TabStyles.indicator]}
        navigationState={{ index: tabIndex, routes: tabs }}
        renderLabel={renderTabLabel}
        style={[TabStyles.tab, { backgroundColor: theme.colors.backgroundBackdrop }]}
      />
    )
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <Flex bg="backgroundBackdrop" m="sm">
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
            lazy={true}
            navigationState={{ index: tabIndex, routes: tabs }}
            renderScene={(props) => renderTab(props.route)}
            renderTabBar={renderTabBar}
            style={TabStyles.tabView}
            onIndexChange={(index) => setIndex(index)}
          />
        )}
      </Flex>
    </Screen>
  )
}

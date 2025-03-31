/* eslint-disable max-lines */
import { useApolloClient } from '@apollo/client'
import { useIsFocused } from '@react-navigation/native'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Freeze } from 'react-freeze'
import { useTranslation } from 'react-i18next'
import { StyleProp, View, ViewProps, ViewStyle } from 'react-native'
import Animated, { FadeIn, interpolateColor, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated'
import { SceneRendererProps, TabBar } from 'react-native-tab-view'
import { useDispatch, useSelector } from 'react-redux'
import { NavBar, SWAP_BUTTON_HEIGHT } from 'src/app/navigation/NavBar'
import { useHomeScreenCustomAndroidBackButton } from 'src/app/navigation/hooks'
import { navigate } from 'src/app/navigation/rootNavigation'
import { AppStackScreenProp } from 'src/app/navigation/types'
import TraceTabView from 'src/components/Trace/TraceTabView'
import { AccountHeader } from 'src/components/accounts/AccountHeader'
import { ACTIVITY_TAB_DATA_DEPENDENCIES, ActivityTab } from 'src/components/home/ActivityTab'
import { HomeExploreTab } from 'src/components/home/HomeExploreTab'
import { NFTS_TAB_DATA_DEPENDENCIES, NftsTab } from 'src/components/home/NftsTab'
import { TOKENS_TAB_DATA_DEPENDENCIES, TokensTab } from 'src/components/home/TokensTab'
import { OnboardingIntroCardStack } from 'src/components/home/introCards/OnboardingIntroCardStack'
import { Screen } from 'src/components/layout/Screen'
import {
  HeaderConfig,
  ScrollPair,
  TAB_BAR_HEIGHT,
  TAB_STYLES,
  TAB_VIEW_SCROLL_THROTTLE,
  TabContentProps,
  TabLabel,
  TabLabelProps,
  useScrollSync,
} from 'src/components/layout/TabHelpers'
import { openModal } from 'src/features/modals/modalSlice'
import { selectSomeModalOpen } from 'src/features/modals/selectSomeModalOpen'
import { DevAIAssistantOverlay } from 'src/features/openai/DevAIGate'
import { useHideSplashScreen } from 'src/features/splashScreen/useHideSplashScreen'
import { useWalletRestore } from 'src/features/wallet/hooks'
import { HomeScreenQuickActions } from 'src/screens/HomeScreen/HomeScreenQuickActions'
import { HomeScreenTabIndex } from 'src/screens/HomeScreen/HomeScreenTabIndex'
import { useHomeScreenState } from 'src/screens/HomeScreen/useHomeScreenState'
import { useHomeScreenTracking } from 'src/screens/HomeScreen/useHomeScreenTracking'
import { useHomeScrollRefs } from 'src/screens/HomeScreen/useHomeScrollRefs'
import { useHapticFeedback } from 'src/utils/haptics/useHapticFeedback'
import { useOpenBackupReminderModal } from 'src/utils/useOpenBackupReminderModal'
import { Flex, Text, TouchableArea, useMedia, useSporeColors } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { spacing } from 'ui/src/theme'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useSelectAddressHasNotifications } from 'uniswap/src/features/notifications/hooks'
import { setNotificationStatus } from 'uniswap/src/features/notifications/slice'
import { ModalName, SectionName, SectionNameType } from 'uniswap/src/features/telemetry/constants'
import { TestnetModeModal } from 'uniswap/src/features/testnets/TestnetModeModal'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { PortfolioBalance } from 'wallet/src/features/portfolio/PortfolioBalance'
import { useHeartbeatReporter, useLastBalancesReporter } from 'wallet/src/features/telemetry/hooks'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

type HomeRoute = {
  key: (typeof SectionName)[keyof typeof SectionName]
  title: string
} & Pick<TabLabelProps, 'textStyleType' | 'enableNotificationBadge'>

const CONTENT_HEADER_HEIGHT_ESTIMATE = 270

/**
 * Home Screen hosts both Tokens and NFTs Tab
 * Manages TokensTabs and NftsTab scroll offsets when header is collapsed
 * Borrowed from: https://stormotion.io/blog/how-to-create-collapsing-tab-header-using-react-native/
 */
export function HomeScreen(props?: AppStackScreenProp<MobileScreens.Home>): JSX.Element {
  const activeAccount = useActiveAccountWithThrow()
  const { t } = useTranslation()
  const colors = useSporeColors()
  const media = useMedia()
  const insets = useAppInsets()
  const dimensions = useDeviceDimensions()
  const dispatch = useDispatch()
  const isFocused = useIsFocused()
  const isModalOpen = useSelector(selectSomeModalOpen)
  const isHomeScreenBlur = !isFocused || isModalOpen
  const hideSplashScreen = useHideSplashScreen()

  const { showEmptyWalletState, isTabsDataLoaded } = useHomeScreenState()

  useHomeScreenTracking()
  // opens the wallet restore modal if recovery phrase is missing after the app is opened
  useWalletRestore({ openModalImmediately: true })
  // Record a heartbeat for anonymous user DAU
  useHeartbeatReporter()
  // Report balances at most every 24 hours, checking every 15 seconds when app is open
  useLastBalancesReporter()

  const [routeTabIndex, setRouteTabIndex] = useState(props?.route?.params?.tab ?? HomeScreenTabIndex.Tokens)
  // Ensures that tabIndex has the proper value between the empty state and non-empty state
  const tabIndex = showEmptyWalletState ? HomeScreenTabIndex.Tokens : routeTabIndex

  useHomeScreenCustomAndroidBackButton(routeTabIndex, setRouteTabIndex)

  // Necessary to declare these as direct dependencies due to race condition with initializing react-i18next and useMemo
  const tokensTitle = t('home.tokens.title')
  const nftsTitle = t('home.nfts.title')
  const activityTitle = t('home.activity.title')
  const exploreTitle = t('home.explore.title')

  const routes = useMemo((): HomeRoute[] => {
    if (showEmptyWalletState) {
      return [
        {
          key: SectionName.HomeExploreTab,
          title: exploreTitle,
          textStyleType: 'secondary',
        },
      ]
    }
    const tabs: Array<HomeRoute> = [
      { key: SectionName.HomeTokensTab, title: tokensTitle },
      { key: SectionName.HomeNFTsTab, title: nftsTitle },
      { key: SectionName.HomeActivityTab, title: activityTitle, enableNotificationBadge: true },
    ]

    return tabs
  }, [showEmptyWalletState, tokensTitle, nftsTitle, activityTitle, exploreTitle])

  useEffect(
    function syncTabIndex() {
      const newTabIndex = props?.route.params?.tab
      if (newTabIndex === undefined) {
        return
      }
      setRouteTabIndex(newTabIndex)
    },
    [props?.route.params?.tab],
  )

  const [isLayoutReady, setIsLayoutReady] = useState(false)

  const [headerHeight, setHeaderHeight] = useState(CONTENT_HEADER_HEIGHT_ESTIMATE)
  const headerConfig = useMemo<HeaderConfig>(
    () => ({
      heightCollapsed: insets.top,
      heightExpanded: headerHeight,
    }),
    [headerHeight, insets.top],
  )
  const { heightCollapsed, heightExpanded } = headerConfig
  const headerHeightDiff = heightExpanded - heightCollapsed

  const handleHeaderLayout = useCallback<NonNullable<ViewProps['onLayout']>>((event) => {
    setHeaderHeight(event.nativeEvent.layout.height)
    setIsLayoutReady(true)
  }, [])

  const {
    tokensTabScrollValue,
    nftsTabScrollValue,
    activityTabScrollValue,
    exploreTabScrollValue,
    tokensTabScrollHandler,
    nftsTabScrollHandler,
    activityTabScrollHandler,
    exploreTabScrollHandler,
    tokensTabScrollRef,
    nftsTabScrollRef,
    activityTabScrollRef,
    exploreTabScrollRef,
    resetScrollState,
  } = useHomeScrollRefs()

  const currentScrollValue = useDerivedValue(() => {
    if (showEmptyWalletState) {
      return exploreTabScrollValue.value
    } else if (tabIndex === HomeScreenTabIndex.Tokens) {
      return tokensTabScrollValue.value
    } else if (tabIndex === HomeScreenTabIndex.NFTs) {
      return nftsTabScrollValue.value
    } else if (tabIndex === HomeScreenTabIndex.Activity) {
      return activityTabScrollValue.value
    }
    return 0
  }, [
    activityTabScrollValue.value,
    exploreTabScrollValue.value,
    showEmptyWalletState,
    nftsTabScrollValue.value,
    tabIndex,
    tokensTabScrollValue.value,
  ])

  // clear the notification indicator if the user is on the activity tab
  const hasNotifications = useSelectAddressHasNotifications(activeAccount.address)
  useEffect(() => {
    if (tabIndex === 2 && hasNotifications) {
      dispatch(setNotificationStatus({ address: activeAccount.address, hasNotifications: false }))
    }
  }, [dispatch, activeAccount.address, tabIndex, hasNotifications])

  // If accounts are switched, we want to scroll to top and show full header
  useEffect(() => {
    resetScrollState()
  }, [activeAccount, resetScrollState])

  // Need to create a derived value for tab index so it can be referenced from a static ref
  const currentTabIndex = useDerivedValue(() => tabIndex, [tabIndex])

  const translateY = useDerivedValue(() => {
    // Allow header to scroll vertically with list
    return -Math.min(currentScrollValue.value, headerHeightDiff)
  })

  const translatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  const scrollPairs = useMemo<ScrollPair[]>(
    () => [
      { list: tokensTabScrollRef, position: tokensTabScrollValue, index: 0 },
      { list: nftsTabScrollRef, position: nftsTabScrollValue, index: 1 },
      { list: activityTabScrollRef, position: activityTabScrollValue, index: 2 },
    ],
    [
      activityTabScrollRef,
      activityTabScrollValue,
      nftsTabScrollRef,
      nftsTabScrollValue,
      tokensTabScrollRef,
      tokensTabScrollValue,
    ],
  )

  const { sync } = useScrollSync(currentTabIndex, scrollPairs, headerConfig)

  // Shows an info modal instead of FOR flow if country is listed behind this flag
  const disableForKorea = useFeatureFlag(FeatureFlags.DisableFiatOnRampKorea)

  const { isTestnetModeEnabled } = useEnabledChains()
  const { hapticFeedback } = useHapticFeedback()

  const triggerHaptics = useCallback(async () => {
    await hapticFeedback.light()
  }, [hapticFeedback])

  const onPressViewOnlyLabel = useCallback(() => dispatch(openModal({ name: ModalName.ViewOnlyExplainer })), [dispatch])

  // Hide actions when active account isn't a signer account.
  const isSignerAccount = activeAccount.type === AccountType.SignerMnemonic

  const [isTestnetWarningModalOpen, setIsTestnetWarningModalOpen] = useState(false)

  const handleTestnetWarningModalClose = useCallback(() => {
    setIsTestnetWarningModalOpen(false)
  }, [])

  // TODO: when TestnetModeModal is moved to react-navigation, this can be moved
  // to the HomeScreenQuickActions component
  const onPressBuy = useCallback(async (): Promise<void> => {
    await triggerHaptics()
    if (isTestnetModeEnabled) {
      setIsTestnetWarningModalOpen(true)
      return
    }
    disableForKorea
      ? navigate(ModalName.KoreaCexTransferInfoModal)
      : dispatch(
          openModal({
            name: ModalName.FiatOnRampAggregator,
          }),
        )
  }, [dispatch, isTestnetModeEnabled, disableForKorea, triggerHaptics])

  // This hooks handles the logic for when to open the BackupReminderModal
  useOpenBackupReminderModal(activeAccount)

  const viewOnlyLabel = t('home.warning.viewOnly')

  const promoBanner = useMemo(
    () => <OnboardingIntroCardStack isLoading={!isTabsDataLoaded} showEmptyWalletState={showEmptyWalletState} />,
    [showEmptyWalletState, isTabsDataLoaded],
  )

  const contentHeader = useMemo(() => {
    return (
      <Flex backgroundColor="$surface1" pb={showEmptyWalletState ? '$spacing8' : '$spacing16'} px="$spacing12">
        <TestnetModeModal
          unsupported
          isOpen={isTestnetWarningModalOpen}
          descriptionCopy={t('tdp.noTestnetSupportDescription')}
          onClose={handleTestnetWarningModalClose}
        />
        <AccountHeader />
        <Flex py="$spacing20" px="$spacing12">
          <PortfolioBalance owner={activeAccount.address} />
        </Flex>
        {isSignerAccount ? (
          <HomeScreenQuickActions onPressBuy={onPressBuy} />
        ) : (
          <TouchableArea mt="$spacing8" onPress={onPressViewOnlyLabel}>
            <Flex centered row backgroundColor="$surface2" borderRadius="$rounded12" minHeight={40} p="$spacing8">
              <Text color="$neutral2" variant="body2">
                {viewOnlyLabel}
              </Text>
            </Flex>
          </TouchableArea>
        )}
        {promoBanner}
      </Flex>
    )
  }, [
    showEmptyWalletState,
    isTestnetWarningModalOpen,
    t,
    handleTestnetWarningModalClose,
    activeAccount.address,
    isSignerAccount,
    onPressViewOnlyLabel,
    viewOnlyLabel,
    promoBanner,
    onPressBuy,
  ])

  const paddingTop = headerHeight + TAB_BAR_HEIGHT + (showEmptyWalletState ? 0 : TAB_STYLES.tabListInner.paddingTop)
  const paddingBottom = insets.bottom + SWAP_BUTTON_HEIGHT + TAB_STYLES.tabListInner.paddingBottom + spacing.spacing12

  const contentContainerStyle = useMemo<StyleProp<ViewStyle>>(
    () => ({ paddingTop, paddingBottom }),
    [paddingTop, paddingBottom],
  )

  const emptyComponentStyle = useMemo<StyleProp<ViewStyle>>(
    () => ({
      minHeight: dimensions.fullHeight - (paddingTop + paddingBottom),
      paddingTop: media.short ? spacing.spacing12 : spacing.spacing32,
      paddingBottom: media.short ? spacing.spacing12 : spacing.spacing32,
      paddingLeft: media.short ? spacing.none : spacing.spacing12,
      paddingRight: media.short ? spacing.none : spacing.spacing12,
    }),
    [dimensions.fullHeight, media.short, paddingBottom, paddingTop],
  )

  const sharedProps = useMemo<TabContentProps>(
    () => ({
      contentContainerStyle,
      emptyComponentStyle,
      onMomentumScrollEnd: sync,
      onScrollEndDrag: sync,
      scrollEventThrottle: TAB_VIEW_SCROLL_THROTTLE,
    }),
    [contentContainerStyle, emptyComponentStyle, sync],
  )

  const tabBarStyle = useMemo<StyleProp<ViewStyle>>(
    () => [{ top: headerHeight }, translatedStyle],
    [headerHeight, translatedStyle],
  )

  const headerContainerStyle = useMemo<StyleProp<ViewStyle>>(
    () => [TAB_STYLES.headerContainer, { paddingTop: insets.top }, translatedStyle],
    [insets.top, translatedStyle],
  )

  const statusBarStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      currentScrollValue.value,
      [0, headerHeightDiff],
      [colors.surface1.val, colors.surface1.val],
    ),
  }))

  const apolloClient = useApolloClient()

  const renderTabLabel = useCallback(
    ({ route, focused, isExternalProfile }: { route: HomeRoute; focused: boolean; isExternalProfile?: boolean }) => {
      const { textStyleType: theme, enableNotificationBadge, ...rest } = route
      return (
        <TabLabel
          enableNotificationBadge={enableNotificationBadge}
          focused={focused}
          isExternalProfile={isExternalProfile}
          route={rest}
          textStyleType={theme}
        />
      )
    },
    [],
  )

  const renderTabBar = useCallback(
    (sceneProps: SceneRendererProps) => {
      const style: ViewStyle = { width: 'auto' }
      if (!isLayoutReady) {
        return null
      }
      return (
        <Animated.View entering={FadeIn} style={[TAB_STYLES.header, tabBarStyle]}>
          <TabBar
            {...sceneProps}
            indicatorStyle={TAB_STYLES.activeTabIndicator}
            navigationState={{ index: tabIndex, routes }}
            pressColor="transparent" // Android only
            renderLabel={renderTabLabel}
            style={[
              TAB_STYLES.tabBar,
              {
                backgroundColor: colors.surface1.get(),
                borderBottomColor: colors.surface3.get(),
                paddingLeft: spacing.spacing12,
              },
            ]}
            tabStyle={style}
          />
        </Animated.View>
      )
    },
    [colors.surface1, colors.surface3, isLayoutReady, renderTabLabel, routes, tabBarStyle, tabIndex],
  )

  const [refreshing, setRefreshing] = useState(false)

  const onRefreshHomeData = useCallback(async () => {
    setRefreshing(true)

    await apolloClient.refetchQueries({
      include: [...TOKENS_TAB_DATA_DEPENDENCIES, ...NFTS_TAB_DATA_DEPENDENCIES, ...ACTIVITY_TAB_DATA_DEPENDENCIES],
    })

    // Artificially delay 0.5 second to show the refresh animation
    const timeout = setTimeout(() => setRefreshing(false), 500)
    return () => clearTimeout(timeout)
  }, [apolloClient])

  const renderTab = useCallback(
    ({
      route,
    }: {
      route: {
        key: SectionNameType
        title: string
      }
    }) => {
      switch (route?.key) {
        case SectionName.HomeTokensTab:
          return (
            <Freeze freeze={tabIndex !== 0 && isHomeScreenBlur}>
              {isLayoutReady && (
                <Animated.View entering={FadeIn}>
                  <TokensTab
                    ref={tokensTabScrollRef}
                    containerProps={sharedProps}
                    headerHeight={headerHeight}
                    owner={activeAccount?.address}
                    refreshing={refreshing}
                    scrollHandler={tokensTabScrollHandler}
                    testID={TestID.TokensTab}
                    onRefresh={onRefreshHomeData}
                  />
                </Animated.View>
              )}
            </Freeze>
          )
        case SectionName.HomeNFTsTab:
          return (
            <Freeze freeze={tabIndex !== 1 && isHomeScreenBlur}>
              <NftsTab
                ref={nftsTabScrollRef}
                containerProps={sharedProps}
                headerHeight={headerHeight}
                owner={activeAccount?.address}
                refreshing={refreshing}
                scrollHandler={nftsTabScrollHandler}
                testID={TestID.NFTsTab}
                onRefresh={onRefreshHomeData}
              />
            </Freeze>
          )
        case SectionName.HomeActivityTab:
          return (
            <Freeze freeze={tabIndex !== 2 && isHomeScreenBlur}>
              <ActivityTab
                ref={activityTabScrollRef}
                containerProps={sharedProps}
                headerHeight={headerHeight}
                owner={activeAccount?.address}
                refreshing={refreshing}
                scrollHandler={activityTabScrollHandler}
                testID={TestID.ActivityTab}
                onRefresh={onRefreshHomeData}
              />
            </Freeze>
          )
        case SectionName.HomeExploreTab:
          return (
            <HomeExploreTab
              ref={exploreTabScrollRef}
              containerProps={sharedProps}
              headerHeight={headerHeight}
              owner={activeAccount?.address}
              refreshing={refreshing}
              scrollHandler={exploreTabScrollHandler}
              onRefresh={onRefreshHomeData}
            />
          )
      }
      return null
    },
    [
      tabIndex,
      isHomeScreenBlur,
      isLayoutReady,
      tokensTabScrollRef,
      sharedProps,
      headerHeight,
      activeAccount?.address,
      refreshing,
      tokensTabScrollHandler,
      onRefreshHomeData,
      nftsTabScrollRef,
      nftsTabScrollHandler,
      activityTabScrollRef,
      activityTabScrollHandler,
      exploreTabScrollRef,
      exploreTabScrollHandler,
    ],
  )

  return (
    <Screen edges={['left', 'right']} onLayout={hideSplashScreen}>
      <DevAIAssistantOverlay />
      <View style={TAB_STYLES.container}>
        <Animated.View style={headerContainerStyle} onLayout={handleHeaderLayout}>
          {contentHeader}
        </Animated.View>

        {isTabsDataLoaded && isLayoutReady && (
          <TraceTabView
            lazy
            initialLayout={{
              height: dimensions.fullHeight,
              width: dimensions.fullWidth,
            }}
            navigationState={{ index: tabIndex, routes }}
            renderScene={renderTab}
            renderTabBar={renderTabBar}
            screenName={MobileScreens.Home}
            onIndexChange={setRouteTabIndex}
          />
        )}
      </View>
      <NavBar />
      <AnimatedFlex
        height={insets.top}
        position="absolute"
        style={statusBarStyle}
        top={0}
        width="100%"
        zIndex="$sticky"
      />
    </Screen>
  )
}

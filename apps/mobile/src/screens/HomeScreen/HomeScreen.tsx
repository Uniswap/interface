/* eslint-disable max-lines */
import { useApolloClient } from '@apollo/client'
import { useIsFocused, useScrollToTop } from '@react-navigation/native'
import { FlashList } from '@shopify/flash-list'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Freeze } from 'react-freeze'
import { useTranslation } from 'react-i18next'
import { FlatList, StyleProp, View, ViewProps, ViewStyle } from 'react-native'
import Animated, {
  FadeIn,
  interpolateColor,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated'
import { SceneRendererProps, TabBar } from 'react-native-tab-view'
import { useDispatch, useSelector } from 'react-redux'
import { NavBar, SWAP_BUTTON_HEIGHT } from 'src/app/navigation/NavBar'
import { useHomeScreenCustomAndroidBackButton } from 'src/app/navigation/hooks'
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
import { HomeScreenTabIndex } from 'src/screens/HomeScreen/HomeScreenTabIndex'
import { useHomeScreenState } from 'src/screens/HomeScreen/useHomeScreenState'
import { useHapticFeedback } from 'src/utils/haptics/useHapticFeedback'
import { useOpenBackupReminderModal } from 'src/utils/useOpenBackupReminderModal'
import { Flex, GeneratedIcon, Text, TouchableArea, useMedia, useSporeColors } from 'ui/src'
import { ArrowDownCircle, Bank, Buy, SendAction } from 'ui/src/components/icons'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { iconSizes, spacing } from 'ui/src/theme'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useCexTransferProviders } from 'uniswap/src/features/fiatOnRamp/useCexTransferProviders'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useSelectAddressHasNotifications } from 'uniswap/src/features/notifications/hooks'
import { setNotificationStatus } from 'uniswap/src/features/notifications/slice'
import Trace from 'uniswap/src/features/telemetry/Trace'
import {
  ElementName,
  ElementNameType,
  MobileEventName,
  ModalName,
  SectionName,
  SectionNameType,
} from 'uniswap/src/features/telemetry/constants'
import { TestnetModeModal } from 'uniswap/src/features/testnets/TestnetModeModal'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { ScannerModalState } from 'wallet/src/components/QRCodeScanner/constants'
import { PortfolioBalance } from 'wallet/src/features/portfolio/PortfolioBalance'
import { TokenBalanceListRow } from 'wallet/src/features/portfolio/TokenBalanceListContext'
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

  // IMPORTANT: We must manually pass a dependency array to `useAnimatedScrollHandler`
  //            because the reanimated babel plugin is not automatically injecting these.

  const tokensTabScrollValue = useSharedValue(0)
  const tokensTabScrollHandler = useAnimatedScrollHandler(
    (event) => (tokensTabScrollValue.value = event.contentOffset.y),
    [tokensTabScrollValue],
  )

  const nftsTabScrollValue = useSharedValue(0)
  const nftsTabScrollHandler = useAnimatedScrollHandler(
    (event) => (nftsTabScrollValue.value = event.contentOffset.y),
    [nftsTabScrollValue],
  )

  const activityTabScrollValue = useSharedValue(0)
  const activityTabScrollHandler = useAnimatedScrollHandler(
    (event) => (activityTabScrollValue.value = event.contentOffset.y),
    [activityTabScrollValue],
  )

  const exploreTabScrollValue = useSharedValue(0)
  const exploreTabScrollHandler = useAnimatedScrollHandler(
    (event) => (exploreTabScrollValue.value = event.contentOffset.y),
    [exploreTabScrollValue],
  )

  const tokensTabScrollRef = useAnimatedRef<FlatList<TokenBalanceListRow>>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nftsTabScrollRef = useAnimatedRef<FlashList<any>>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activityTabScrollRef = useAnimatedRef<FlatList<any>>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exploreTabScrollRef = useAnimatedRef<FlatList<any>>()

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
    nftsTabScrollValue.value = 0
    tokensTabScrollValue.value = 0
    activityTabScrollValue.value = 0
    exploreTabScrollValue.value = 0
    nftsTabScrollRef.current?.scrollToOffset({ offset: 0, animated: true })
    tokensTabScrollRef.current?.scrollToOffset({ offset: 0, animated: true })
    activityTabScrollRef.current?.scrollToOffset({ offset: 0, animated: true })
    exploreTabScrollRef.current?.scrollToOffset({ offset: 0, animated: true })
  }, [
    activeAccount,
    activityTabScrollRef,
    activityTabScrollValue,
    exploreTabScrollRef,
    exploreTabScrollValue,
    nftsTabScrollRef,
    nftsTabScrollValue,
    tokensTabScrollRef,
    tokensTabScrollValue,
  ])

  // Need to create a derived value for tab index so it can be referenced from a static ref
  const currentTabIndex = useDerivedValue(() => tabIndex, [tabIndex])
  const isNftTabsAtTop = useDerivedValue(() => nftsTabScrollValue.value === 0)
  const isActivityTabAtTop = useDerivedValue(() => activityTabScrollValue.value === 0)

  useScrollToTop(
    useRef({
      scrollToTop: () => {
        if (showEmptyWalletState) {
          exploreTabScrollRef.current?.scrollToOffset({ offset: 0, animated: true })
        } else if (currentTabIndex.value === HomeScreenTabIndex.NFTs && isNftTabsAtTop.value) {
          setRouteTabIndex(HomeScreenTabIndex.Tokens)
        } else if (currentTabIndex.value === HomeScreenTabIndex.NFTs) {
          nftsTabScrollRef.current?.scrollToOffset({ offset: 0, animated: true })
        } else if (currentTabIndex.value === HomeScreenTabIndex.Activity && isActivityTabAtTop.value) {
          setRouteTabIndex(HomeScreenTabIndex.NFTs)
        } else if (currentTabIndex.value === HomeScreenTabIndex.Activity) {
          activityTabScrollRef.current?.scrollToOffset({ offset: 0, animated: true })
        } else {
          tokensTabScrollRef.current?.scrollToOffset({ offset: 0, animated: true })
        }
      },
    }),
  )

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

  const cexTransferProviders = useCexTransferProviders()
  const { isTestnetModeEnabled } = useEnabledChains()
  const { hapticFeedback } = useHapticFeedback()

  const triggerHaptics = useCallback(async () => {
    await hapticFeedback.light()
  }, [hapticFeedback])

  const onPressSend = useCallback(async () => {
    dispatch(openModal({ name: ModalName.Send }))
    await triggerHaptics()
  }, [dispatch, triggerHaptics])
  const onPressReceive = useCallback(async () => {
    dispatch(
      openModal(
        cexTransferProviders.length > 0
          ? { name: ModalName.ReceiveCryptoModal, initialState: cexTransferProviders }
          : { name: ModalName.WalletConnectScan, initialState: ScannerModalState.WalletQr },
      ),
    )
    await triggerHaptics()
  }, [dispatch, cexTransferProviders, triggerHaptics])
  const onPressViewOnlyLabel = useCallback(() => dispatch(openModal({ name: ModalName.ViewOnlyExplainer })), [dispatch])

  // Hide actions when active account isn't a signer account.
  const isSignerAccount = activeAccount.type === AccountType.SignerMnemonic

  const [isTestnetWarningModalOpen, setIsTestnetWarningModalOpen] = useState(false)

  const handleTestnetWarningModalClose = useCallback(() => {
    setIsTestnetWarningModalOpen(false)
  }, [])

  const onPressBuy = useCallback(async (): Promise<void> => {
    await triggerHaptics()
    if (isTestnetModeEnabled) {
      setIsTestnetWarningModalOpen(true)
      return
    }
    dispatch(
      openModal({
        name: disableForKorea ? ModalName.KoreaCexTransferInfoModal : ModalName.FiatOnRampAggregator,
      }),
    )
  }, [dispatch, isTestnetModeEnabled, disableForKorea, triggerHaptics])

  // Necessary to declare these as direct dependencies due to race condition with initializing react-i18next and useMemo
  const buyLabel = t('home.label.buy')
  const forLabel = t('home.label.for')
  const sendLabel = t('home.label.send')
  const receiveLabel = t('home.label.receive')
  const isOffRampEnabled = useFeatureFlag(FeatureFlags.FiatOffRamp)

  const actions = useMemo(
    (): QuickAction[] => [
      {
        Icon: isOffRampEnabled ? Bank : Buy,
        eventName: MobileEventName.FiatOnRampQuickActionButtonPressed,
        label: isOffRampEnabled ? forLabel : buyLabel,
        name: ElementName.Buy,
        onPress: onPressBuy,
      },
      {
        Icon: SendAction,
        label: sendLabel,
        name: ElementName.Send,
        onPress: onPressSend,
      },
      {
        Icon: ArrowDownCircle,
        label: receiveLabel,
        name: ElementName.Receive,
        onPress: onPressReceive,
      },
    ],
    [isOffRampEnabled, buyLabel, forLabel, sendLabel, receiveLabel, onPressBuy, onPressSend, onPressReceive],
  )

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
          <QuickActions actions={actions} />
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
    actions,
    onPressViewOnlyLabel,
    viewOnlyLabel,
    promoBanner,
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

type QuickAction = {
  /* Icon to display for the action */
  Icon: GeneratedIcon
  /* Event name to log when the action is triggered */
  eventName?: MobileEventName
  /* Label to display for the action */
  label: string
  /* Name of the element to log when the action is triggered */
  name: ElementNameType
  /* Callback to execute when the action is triggered */
  onPress: () => void
}

/**
 * CTA buttons that appear at top of the screen showing actions such as
 * "Send", "Receive", "Buy" etc.
 */
function QuickActions({ actions }: { actions: QuickAction[] }): JSX.Element {
  const colors = useSporeColors()
  const iconSize = iconSizes.icon24
  const contentColor = colors.accent1.val
  const activeScale = 0.96

  return (
    <Flex centered row gap="$spacing8" px="$spacing12">
      {actions.map(({ eventName, name, label, Icon, onPress }) => (
        <Trace key={name} logPress element={name} eventOnTrigger={eventName}>
          <TouchableArea flex={1} scaleTo={activeScale} onPress={onPress}>
            <Flex
              fill
              backgroundColor="$accent2"
              borderRadius="$rounded20"
              py="$spacing16"
              px="$spacing12"
              gap="$spacing12"
              justifyContent="space-between"
            >
              <Icon color={contentColor} size={iconSize} strokeWidth={2} />
              <Text color={contentColor} variant="buttonLabel2">
                {label}
              </Text>
            </Flex>
          </TouchableArea>
        </Trace>
      ))}
    </Flex>
  )
}

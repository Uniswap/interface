/* eslint-disable max-lines */
import { useApolloClient } from '@apollo/client'
import { useIsFocused, useScrollToTop } from '@react-navigation/native'
import { SharedQueryClient } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Freeze } from 'react-freeze'
import { useTranslation } from 'react-i18next'
import { StyleProp, View, ViewProps, ViewStyle } from 'react-native'
import Animated, { FadeIn, interpolateColor, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated'
import { SceneRendererProps, TabBar } from 'react-native-tab-view'
import { Video } from 'react-native-video'
import { useDispatch, useSelector } from 'react-redux'
import { useHomeScreenCustomAndroidBackButton } from 'src/app/navigation/hooks'
import { NavBar, SWAP_BUTTON_HEIGHT } from 'src/app/navigation/NavBar'
import { navigate } from 'src/app/navigation/rootNavigation'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { AccountHeader } from 'src/components/accounts/AccountHeader'
import { ActivityContent } from 'src/components/activity/ActivityContent'
import { HomeExploreTab } from 'src/components/home/HomeExploreTab'
import { OnboardingIntroCardStack } from 'src/components/home/introCards/OnboardingIntroCardStack'
import { NftsTab } from 'src/components/home/NftsTab'
import { TokensTab } from 'src/components/home/TokensTab'
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
import TraceTabView from 'src/components/Trace/TraceTabView'
import { useBiometricAppSettings } from 'src/features/biometrics/useBiometricAppSettings'
import { useBiometricPrompt } from 'src/features/biometricsSettings/hooks'
import { selectSomeModalOpen } from 'src/features/modals/selectSomeModalOpen'
import { useHideSplashScreen } from 'src/features/splashScreen/useHideSplashScreen'
import { useWalletRestore } from 'src/features/wallet/useWalletRestore'
import { HomeScreenQuickActions } from 'src/screens/HomeScreen/HomeScreenQuickActions'
import { HomeScreenTabIndex } from 'src/screens/HomeScreen/HomeScreenTabIndex'
import { useHomeScreenState } from 'src/screens/HomeScreen/useHomeScreenState'
import { useHomeScrollRefs } from 'src/screens/HomeScreen/useHomeScrollRefs'
import { useOpenBackupReminderModal } from 'src/utils/useOpenBackupReminderModal'
import { Flex, Image, Text, TouchableArea, useMedia, useSporeColors } from 'ui/src'
import { SMART_WALLET_UPGRADE_FALLBACK, SMART_WALLET_UPGRADE_VIDEO } from 'ui/src/assets'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { spacing } from 'ui/src/theme'
import { NFTS_TAB_DATA_DEPENDENCIES } from 'uniswap/src/components/nfts/constants'
import { getPortfolioQuery } from 'uniswap/src/data/rest/getPortfolio'
import { getListTransactionsQuery } from 'uniswap/src/data/rest/listTransactions'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useSelectAddressHasNotifications } from 'uniswap/src/features/notifications/slice/hooks'
import { setNotificationStatus } from 'uniswap/src/features/notifications/slice/slice'
import { PortfolioBalance } from 'uniswap/src/features/portfolio/PortfolioBalance/PortfolioBalance'
import { ModalName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { SmartWalletCreatedModal } from 'wallet/src/components/smartWallet/modals/SmartWalletCreatedModal'
import { SmartWalletUpgradeModals } from 'wallet/src/components/smartWallet/modals/SmartWalletUpgradeModal'
import { useOpenSmartWalletNudgeOnCompletedSwap } from 'wallet/src/components/smartWallet/smartAccounts/hooks'
import { selectHasSeenCreatedSmartWalletModal } from 'wallet/src/features/behaviorHistory/selectors'
import {
  setHasSeenSmartWalletCreatedWalletModal,
  setIncrementNumPostSwapNudge,
} from 'wallet/src/features/behaviorHistory/slice'
import { useAccountCountChanged, useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'
import { setSmartWalletConsent } from 'wallet/src/features/wallet/slice'

type HomeRoute = {
  key: (typeof SectionName)[keyof typeof SectionName]
  title: string
} & Pick<TabLabelProps, 'textStyleType' | 'enableNotificationBadge'>

const CONTENT_HEADER_HEIGHT_ESTIMATE = 270

/**
 * Adding `key` forces a full re-render and re-mount when switching accounts
 * to avoid issues with wrong cached data being shown in some memoized components that are already mounted.
 */
export function WrappedHomeScreen(props: AppStackScreenProp<MobileScreens.Home>): JSX.Element {
  const activeAccount = useActiveAccountWithThrow()
  return <HomeScreen key={activeAccount.address} {...props} />
}

/**
 * Home Screen hosts both Tokens and NFTs Tab
 * Manages TokensTabs and NftsTab scroll offsets when header is collapsed
 * Borrowed from: https://stormotion.io/blog/how-to-create-collapsing-tab-header-using-react-native/
 */
function HomeScreen(props?: AppStackScreenProp<MobileScreens.Home>): JSX.Element {
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
  const isSmartWalletEnabled = useFeatureFlag(FeatureFlags.SmartWallet)
  const SmartWalletDisableVideo = useFeatureFlag(FeatureFlags.SmartWalletDisableVideo)
  const { requiredForTransactions: requiresBiometrics } = useBiometricAppSettings()

  const isBottomTabsEnabled = useFeatureFlag(FeatureFlags.BottomTabs)

  const { showEmptyWalletState, isTabsDataLoaded } = useHomeScreenState()

  // opens the wallet restore modal if recovery phrase is missing after the app is opened
  useWalletRestore({ openModalImmediately: true })

  const { trigger } = useBiometricPrompt()

  const [routeTabIndex, setRouteTabIndex] = useState(props?.route.params?.tab ?? HomeScreenTabIndex.Tokens)
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
      ...(!isBottomTabsEnabled ? [{ key: SectionName.HomeActivityTab, title: activityTitle }] : []),
    ]

    return tabs
  }, [showEmptyWalletState, tokensTitle, nftsTitle, isBottomTabsEnabled, activityTitle, exploreTitle])

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

  // Only enable scroll to top for bottom tab mode
  const dummyRef = useRef(null)
  useScrollToTop(isBottomTabsEnabled ? tokensTabScrollRef : dummyRef)
  useScrollToTop(isBottomTabsEnabled ? exploreTabScrollRef : dummyRef)
  // We need to create a new ref for this because the nfts tab is a flash list, which is not supported by useScrollToTop
  const nftsScrollToTopRef = useRef({
    scrollToTop: () => nftsTabScrollRef.current?.scrollToOffset({ offset: 0, animated: true }),
  })

  useScrollToTop(isBottomTabsEnabled ? nftsScrollToTopRef : dummyRef)

  // clear the notification indicator if the user is on the activity tab
  const hasNotifications = useSelectAddressHasNotifications(activeAccount.address)
  useEffect(() => {
    if (isBottomTabsEnabled) {
      return
    }
    if (tabIndex === 2 && hasNotifications) {
      dispatch(setNotificationStatus({ address: activeAccount.address, hasNotifications: false }))
    }
  }, [dispatch, activeAccount.address, tabIndex, hasNotifications, isBottomTabsEnabled])

  // If accounts are switched, we want to scroll to top and show full header
  // biome-ignore lint/correctness/useExhaustiveDependencies: we want to trigger this effect also when activeAccount changes
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
      ...(!isBottomTabsEnabled ? [{ list: activityTabScrollRef, position: activityTabScrollValue, index: 2 }] : []),
    ],
    [
      activityTabScrollRef,
      activityTabScrollValue,
      isBottomTabsEnabled,
      nftsTabScrollRef,
      nftsTabScrollValue,
      tokensTabScrollRef,
      tokensTabScrollValue,
    ],
  )

  const { sync } = useScrollSync({ currentTabIndex, scrollPairs, headerConfig })

  const onPressViewOnlyLabel = useCallback(() => navigate(ModalName.ViewOnlyExplainer), [])

  // Hide actions when active account isn't a signer account.
  const isSignerAccount = activeAccount.type === AccountType.SignerMnemonic

  // This hooks handles the logic for when to open the BackupReminderModal
  useOpenBackupReminderModal(activeAccount)

  const viewOnlyLabel = t('home.warning.viewOnly')

  const promoBanner = useMemo(
    () => <OnboardingIntroCardStack isLoading={!isTabsDataLoaded} showEmptyWalletState={showEmptyWalletState} />,
    [showEmptyWalletState, isTabsDataLoaded],
  )

  const contentHeader = useMemo(() => {
    return (
      <Flex
        backgroundColor="$surface1"
        pb={showEmptyWalletState ? '$spacing8' : '$spacing16'}
        px={isBottomTabsEnabled ? '$none' : '$spacing12'}
      >
        <AccountHeader />
        <Flex py="$spacing20" px={isBottomTabsEnabled ? '$spacing24' : '$spacing12'}>
          <PortfolioBalance owner={activeAccount.address} />
        </Flex>
        {isSignerAccount ? (
          <HomeScreenQuickActions />
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
    isBottomTabsEnabled,
    activeAccount.address,
    isSignerAccount,
    onPressViewOnlyLabel,
    viewOnlyLabel,
    promoBanner,
  ])

  const [hasVideoError, setVideoHasError] = useState(false)

  const MemoizedVideo = useMemo(() => {
    if (hasVideoError) {
      return (
        <Flex width="100%" borderRadius="$rounded12" overflow="hidden">
          <Image height={200} source={SMART_WALLET_UPGRADE_FALLBACK} maxWidth="100%" />
        </Flex>
      )
    }

    return (
      <Flex borderRadius="$rounded16" width="100%" aspectRatio={16 / 9} overflow="hidden" mb="$spacing8">
        <Video
          disableFocus={true}
          source={SMART_WALLET_UPGRADE_VIDEO}
          poster={SMART_WALLET_UPGRADE_FALLBACK}
          resizeMode="cover"
          style={{ width: '100%', height: '100%' }}
          onError={(error) => {
            logger.warn('HomeScreen', 'MemoizedVideo', 'video error', error)
            setVideoHasError(true)
          }}
        />
      </Flex>
    )
  }, [hasVideoError])

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
          enableNotificationBadge={isBottomTabsEnabled ? false : enableNotificationBadge}
          focused={focused}
          isExternalProfile={isExternalProfile}
          route={rest}
          textStyleType={theme}
        />
      )
    },
    [isBottomTabsEnabled],
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

    const activeAccountAddress = activeAccount.address

    const restQueriesToInvalidate = [
      SharedQueryClient.invalidateQueries({
        queryKey: getPortfolioQuery({ input: { evmAddress: activeAccountAddress } }).queryKey,
      }),
      // Always invalidate transactions since we use REST for transactions
      SharedQueryClient.invalidateQueries({
        queryKey: getListTransactionsQuery({ input: { evmAddress: activeAccountAddress } }).queryKey,
      }),
    ]
    const gqlQueriesToRefetch = [...NFTS_TAB_DATA_DEPENDENCIES]

    await Promise.all([
      ...restQueriesToInvalidate,
      apolloClient.refetchQueries({
        include: gqlQueriesToRefetch,
      }),
    ])

    // Artificially delay 0.5 second to show the refresh animation
    const timeout = setTimeout(() => setRefreshing(false), 500)
    return () => clearTimeout(timeout)
  }, [apolloClient, activeAccount.address])

  const renderTab = useCallback(
    ({
      route,
    }: {
      route: {
        key: SectionName
        title: string
      }
    }) => {
      switch (route.key) {
        case SectionName.HomeTokensTab:
          return (
            <Freeze freeze={tabIndex !== HomeScreenTabIndex.Tokens && isHomeScreenBlur}>
              {isLayoutReady && (
                <Animated.View entering={FadeIn}>
                  <TokensTab
                    ref={tokensTabScrollRef}
                    containerProps={sharedProps}
                    headerHeight={headerHeight}
                    owner={activeAccount.address}
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
            <Freeze freeze={tabIndex !== HomeScreenTabIndex.NFTs && isHomeScreenBlur}>
              <NftsTab
                ref={nftsTabScrollRef}
                containerProps={sharedProps}
                headerHeight={headerHeight}
                owner={activeAccount.address}
                refreshing={refreshing}
                scrollHandler={nftsTabScrollHandler}
                testID={TestID.NFTsTab}
                isActiveTab={tabIndex === HomeScreenTabIndex.NFTs && !isHomeScreenBlur}
                onRefresh={onRefreshHomeData}
              />
            </Freeze>
          )
        case SectionName.HomeActivityTab:
          return (
            <Freeze freeze={tabIndex !== HomeScreenTabIndex.Activity && isHomeScreenBlur}>
              <ActivityContent
                ref={activityTabScrollRef}
                containerProps={sharedProps}
                headerHeight={headerHeight}
                owner={activeAccount.address}
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
              owner={activeAccount.address}
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
      activeAccount.address,
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

  const handleSmartWalletEnable = useCallback(
    async (onComplete?: () => void): Promise<void> => {
      const successAction = (): void => {
        dispatch(setSmartWalletConsent({ address: activeAccount.address, smartWalletConsent: true }))
        onComplete?.()
        navigate(ModalName.SmartWalletEnabledModal, {
          showReconnectDappPrompt: false,
        })
      }

      if (requiresBiometrics) {
        await trigger({ successCallback: successAction })
      } else {
        successAction()
      }
    },
    [dispatch, activeAccount.address, requiresBiometrics, trigger],
  )

  const hasSeenCreatedSmartWalletModal = useSelector(selectHasSeenCreatedSmartWalletModal)
  const [shouldShowCreatedModal, setShouldShowCreatedModal] = useState(false)

  // Setup listener for account creation events to show the SmartWalletCreatedModal
  useAccountCountChanged(
    useEvent(() => {
      if (hasSeenCreatedSmartWalletModal) {
        return
      }
      setShouldShowCreatedModal(true)
    }),
  )

  const shouldOpenSmartWalletCreatedModal =
    isSmartWalletEnabled &&
    isTabsDataLoaded &&
    isLayoutReady &&
    shouldShowCreatedModal &&
    !hasSeenCreatedSmartWalletModal

  useOpenSmartWalletNudgeOnCompletedSwap(
    useEvent(() => {
      if (!activeAccount.address || activeAccount.type !== AccountType.SignerMnemonic) {
        return
      }

      navigate(ModalName.SmartWalletNudge, {
        onEnableSmartWallet: async () => {
          const successAction = (): void => {
            dispatch(setSmartWalletConsent({ address: activeAccount.address, smartWalletConsent: true }))
            navigate(ModalName.SmartWalletEnabledModal, {
              showReconnectDappPrompt: false,
            })
          }

          if (requiresBiometrics) {
            await trigger({ successCallback: successAction })
          } else {
            successAction()
          }
        },
      })
      dispatch(setIncrementNumPostSwapNudge({ walletAddress: activeAccount.address }))
    }),
  )

  return (
    <Screen edges={['left', 'right']} onLayout={hideSplashScreen}>
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
      {!isBottomTabsEnabled && <NavBar />}
      <AnimatedFlex
        height={insets.top}
        position="absolute"
        style={statusBarStyle}
        top={0}
        width="100%"
        zIndex="$sticky"
      />

      {isSmartWalletEnabled && (
        <SmartWalletUpgradeModals
          account={activeAccount}
          video={!SmartWalletDisableVideo && MemoizedVideo}
          isHomeScreenFocused={isFocused}
          onEnableSmartWallet={handleSmartWalletEnable}
        />
      )}

      <SmartWalletCreatedModal
        isOpen={shouldOpenSmartWalletCreatedModal}
        onClose={() => {
          setShouldShowCreatedModal(false)
          dispatch(setHasSeenSmartWalletCreatedWalletModal())
        }}
      />
    </Screen>
  )
}

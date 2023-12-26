/* eslint-disable max-lines */
import { useIsFocused, useScrollToTop } from '@react-navigation/native'
import { FlashList } from '@shopify/flash-list'
import { impactAsync } from 'expo-haptics'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Freeze } from 'react-freeze'
import { useTranslation } from 'react-i18next'
import { FlatList, StyleProp, View, ViewProps, ViewStyle } from 'react-native'
import { TapGestureHandler, TapGestureHandlerGestureEvent } from 'react-native-gesture-handler'
import Animated, {
  cancelAnimation,
  FadeIn,
  interpolateColor,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated'
import { SvgProps } from 'react-native-svg'
import { SceneRendererProps, TabBar } from 'react-native-tab-view'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { NavBar, SWAP_BUTTON_HEIGHT } from 'src/app/navigation/NavBar'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { AccountHeader } from 'src/components/accounts/AccountHeader'
import { pulseAnimation } from 'src/components/buttons/utils'
import { ActivityTab, ACTIVITY_TAB_DATA_DEPENDENCIES } from 'src/components/home/ActivityTab'
import { FeedTab, FEED_TAB_DATA_DEPENDENCIES } from 'src/components/home/FeedTab'
import { NftsTab, NFTS_TAB_DATA_DEPENDENCIES } from 'src/components/home/NftsTab'
import { TokensTab, TOKENS_TAB_DATA_DEPENDENCIES } from 'src/components/home/TokensTab'
import { Screen } from 'src/components/layout/Screen'
import {
  HeaderConfig,
  renderTabLabel,
  ScrollPair,
  TabContentProps,
  TAB_BAR_HEIGHT,
  TAB_STYLES,
  TAB_VIEW_SCROLL_THROTTLE,
  useScrollSync,
} from 'src/components/layout/TabHelpers'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { TokenBalanceListRow } from 'src/components/TokenBalanceList/TokenBalanceListContext'
import Trace from 'src/components/Trace/Trace'
import TraceTabView from 'src/components/Trace/TraceTabView'
import { UnitagBanner } from 'src/components/unitags/UnitagBanner'
import { apolloClient } from 'src/data/usePersistedApolloClient'
import { PortfolioBalance } from 'src/features/balances/PortfolioBalance'
import { openModal } from 'src/features/modals/modalSlice'
import { selectSomeModalOpen } from 'src/features/modals/selectSomeModalOpen'
import { useSelectAddressHasNotifications } from 'src/features/notifications/hooks'
import {
  ElementName,
  MobileEventName,
  ModalName,
  SectionName,
} from 'src/features/telemetry/constants'
import { useLastBalancesReporter } from 'src/features/telemetry/hooks'
import { useWalletRestore } from 'src/features/wallet/hooks'
import { removePendingSession } from 'src/features/walletConnect/walletConnectSlice'
import { Screens } from 'src/screens/Screens'
import { hideSplashScreen } from 'src/utils/splashScreen'
import {
  AnimatedFlex,
  Flex,
  Text,
  TouchableArea,
  useDeviceDimensions,
  useDeviceInsets,
  useMedia,
  useSporeColors,
} from 'ui/src'
import ReceiveIcon from 'ui/src/assets/icons/arrow-down-circle-filled.svg'
import BuyIcon from 'ui/src/assets/icons/buy.svg'
import ScanIcon from 'ui/src/assets/icons/scan-home.svg'
import SendIcon from 'ui/src/assets/icons/send-action.svg'
import { iconSizes, spacing } from 'ui/src/theme'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useInterval, useTimeout } from 'utilities/src/time/timing'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { useFeatureFlag } from 'wallet/src/features/experiments/hooks'
import { setNotificationStatus } from 'wallet/src/features/notifications/slice'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'
import { HomeScreenTabIndex } from './HomeScreenTabIndex'

const CONTENT_HEADER_HEIGHT_ESTIMATE = 270

/**
 * Home Screen hosts both Tokens and NFTs Tab
 * Manages TokensTabs and NftsTab scroll offsets when header is collapsed
 * Borrowed from: https://stormotion.io/blog/how-to-create-collapsing-tab-header-using-react-native/
 */
export function HomeScreen(props?: AppStackScreenProp<Screens.Home>): JSX.Element {
  const activeAccount = useActiveAccountWithThrow()
  const { t } = useTranslation()
  const colors = useSporeColors()
  const media = useMedia()
  const insets = useDeviceInsets()
  const dimensions = useDeviceDimensions()
  const dispatch = useAppDispatch()
  const isFocused = useIsFocused()
  const isModalOpen = useAppSelector(selectSomeModalOpen)
  const isHomeScreenBlur = !isFocused || isModalOpen

  const showFeedTab = useFeatureFlag(FEATURE_FLAGS.FeedTab)
  // opens the wallet restore modal if recovery phrase is missing after the app is opened
  useWalletRestore({ openModalImmediately: true })

  // Report balances at most every 24 hours, checking every 15 seconds when app is open
  const lastBalancesReporter = useLastBalancesReporter()
  useInterval(lastBalancesReporter, ONE_SECOND_MS * 15, true)

  const listBottomPadding = media.short ? spacing.spacing36 : spacing.spacing12

  const [tabIndex, setTabIndex] = useState(props?.route?.params?.tab ?? HomeScreenTabIndex.Tokens)
  // Necessary to declare these as direct dependencies due to race condition with initializing react-i18next and useMemo
  const tokensTitle = t('Tokens')
  const nftsTitle = t('NFTs')
  const activityTitle = t('Activity')
  const feedTitle = t('Feed')

  const routes = useMemo(() => {
    const tabs = [
      { key: SectionName.HomeTokensTab, title: tokensTitle },
      { key: SectionName.HomeNFTsTab, title: nftsTitle },
      { key: SectionName.HomeActivityTab, title: activityTitle },
    ]

    if (showFeedTab) {
      tabs.push({ key: SectionName.HomeFeedTab, title: feedTitle })
    }

    return tabs
  }, [tokensTitle, nftsTitle, activityTitle, feedTitle, showFeedTab])

  useEffect(
    function syncTabIndex() {
      const newTabIndex = props?.route.params?.tab
      if (newTabIndex === undefined) return
      setTabIndex(newTabIndex)
    },
    [props?.route.params?.tab]
  )

  const [isLayoutReady, setIsLayoutReady] = useState(false)

  const [headerHeight, setHeaderHeight] = useState(CONTENT_HEADER_HEIGHT_ESTIMATE)
  const headerConfig = useMemo<HeaderConfig>(
    () => ({
      heightCollapsed: insets.top,
      heightExpanded: headerHeight,
    }),
    [headerHeight, insets.top]
  )
  const { heightCollapsed, heightExpanded } = headerConfig
  const headerHeightDiff = heightExpanded - heightCollapsed

  const handleHeaderLayout = useCallback<NonNullable<ViewProps['onLayout']>>((event) => {
    setHeaderHeight(event.nativeEvent.layout.height)
    setIsLayoutReady(true)
  }, [])

  const tokensTabScrollValue = useSharedValue(0)
  const tokensTabScrollHandler = useAnimatedScrollHandler(
    (event) => (tokensTabScrollValue.value = event.contentOffset.y)
  )
  const nftsTabScrollValue = useSharedValue(0)
  const nftsTabScrollHandler = useAnimatedScrollHandler(
    (event) => (nftsTabScrollValue.value = event.contentOffset.y)
  )
  const activityTabScrollValue = useSharedValue(0)
  const activityTabScrollHandler = useAnimatedScrollHandler(
    (event) => (activityTabScrollValue.value = event.contentOffset.y)
  )
  const feedTabScrollValue = useSharedValue(0)
  const feedTabScrollHandler = useAnimatedScrollHandler(
    (event) => (feedTabScrollValue.value = event.contentOffset.y)
  )

  const tokensTabScrollRef = useAnimatedRef<FlatList<TokenBalanceListRow>>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nftsTabScrollRef = useAnimatedRef<FlashList<any>>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activityTabScrollRef = useAnimatedRef<FlatList<any>>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const feedTabScrollRef = useAnimatedRef<FlatList<any>>()

  const currentScrollValue = useDerivedValue(() => {
    if (tabIndex === HomeScreenTabIndex.Tokens) {
      return tokensTabScrollValue.value
    } else if (tabIndex === HomeScreenTabIndex.NFTs) {
      return nftsTabScrollValue.value
    } else if (tabIndex === HomeScreenTabIndex.Activity) {
      return activityTabScrollValue.value
    }
    return feedTabScrollValue.value
  }, [tabIndex])

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
    feedTabScrollValue.value = 0
    nftsTabScrollRef.current?.scrollToOffset({ offset: 0, animated: true })
    tokensTabScrollRef.current?.scrollToOffset({ offset: 0, animated: true })
    activityTabScrollRef.current?.scrollToOffset({ offset: 0, animated: true })
    feedTabScrollRef.current?.scrollToOffset({ offset: 0, animated: true })
  }, [
    activeAccount,
    activityTabScrollRef,
    activityTabScrollValue,
    nftsTabScrollRef,
    nftsTabScrollValue,
    tokensTabScrollRef,
    tokensTabScrollValue,
    feedTabScrollRef,
    feedTabScrollValue,
  ])

  // Need to create a derived value for tab index so it can be referenced from a static ref
  const currentTabIndex = useDerivedValue(() => tabIndex, [tabIndex])
  const isNftTabsAtTop = useDerivedValue(() => nftsTabScrollValue.value === 0)
  const isActivityTabAtTop = useDerivedValue(() => activityTabScrollValue.value === 0)

  useScrollToTop(
    useRef({
      scrollToTop: () => {
        if (currentTabIndex.value === HomeScreenTabIndex.NFTs && isNftTabsAtTop.value) {
          setTabIndex(HomeScreenTabIndex.Tokens)
        } else if (currentTabIndex.value === HomeScreenTabIndex.NFTs) {
          nftsTabScrollRef.current?.scrollToOffset({ offset: 0, animated: true })
        } else if (
          currentTabIndex.value === HomeScreenTabIndex.Activity &&
          isActivityTabAtTop.value
        ) {
          setTabIndex(HomeScreenTabIndex.NFTs)
        } else if (currentTabIndex.value === HomeScreenTabIndex.Activity) {
          activityTabScrollRef.current?.scrollToOffset({ offset: 0, animated: true })
        } else {
          tokensTabScrollRef.current?.scrollToOffset({ offset: 0, animated: true })
        }
      },
    })
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
      { list: feedTabScrollRef, position: feedTabScrollValue, index: 3 },
    ],
    [
      activityTabScrollRef,
      activityTabScrollValue,
      feedTabScrollRef,
      feedTabScrollValue,
      nftsTabScrollRef,
      nftsTabScrollValue,
      tokensTabScrollRef,
      tokensTabScrollValue,
    ]
  )

  const { sync } = useScrollSync(currentTabIndex, scrollPairs, headerConfig)

  const forAggregatorEnabled = useFeatureFlag(FEATURE_FLAGS.ForAggregator)

  const onPressBuy = useCallback(
    () =>
      dispatch(
        openModal({
          name: forAggregatorEnabled ? ModalName.FiatOnRampAggregator : ModalName.FiatOnRamp,
        })
      ),
    [dispatch, forAggregatorEnabled]
  )
  const onPressScan = useCallback(() => {
    // in case we received a pending session from a previous scan after closing modal
    dispatch(removePendingSession())
    dispatch(
      openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.ScanQr })
    )
  }, [dispatch])
  const onPressSend = useCallback(() => dispatch(openModal({ name: ModalName.Send })), [dispatch])
  const onPressReceive = useCallback(
    () =>
      dispatch(
        openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.WalletQr })
      ),
    [dispatch]
  )

  // Hide actions when active account isn't a signer account.
  const isSignerAccount = activeAccount.type === AccountType.SignerMnemonic
  // Necessary to declare these as direct dependencies due to race condition with initializing react-i18next and useMemo
  const buyLabel = t('Buy')
  const sendLabel = t('Send')
  const receiveLabel = t('Receive')
  const scanLabel = t('Scan')

  const actions = useMemo(
    (): QuickAction[] => [
      {
        Icon: BuyIcon,
        eventName: MobileEventName.FiatOnRampQuickActionButtonPressed,
        iconScale: 1.2,
        label: buyLabel,
        name: ElementName.Buy,
        sentryLabel: 'BuyActionButton',
        onPress: onPressBuy,
      },
      {
        Icon: SendIcon,
        iconScale: 1.1,
        label: sendLabel,
        name: ElementName.Send,
        sentryLabel: 'SendActionButton',
        onPress: onPressSend,
      },
      {
        Icon: ReceiveIcon,
        label: receiveLabel,
        name: ElementName.Receive,
        sentryLabel: 'ReceiveActionButton',
        onPress: onPressReceive,
      },
      {
        Icon: ScanIcon,
        label: scanLabel,
        name: ElementName.WalletConnectScan,
        sentryLabel: 'ScanActionButton',
        onPress: onPressScan,
      },
    ],
    [
      buyLabel,
      sendLabel,
      scanLabel,
      receiveLabel,
      onPressBuy,
      onPressScan,
      onPressSend,
      onPressReceive,
    ]
  )

  const unitagsFeatureFlagEnabled = useFeatureFlag(FEATURE_FLAGS.Unitags)
  const viewOnlyLabel = t('This is a view-only wallet')
  const contentHeader = useMemo(() => {
    return (
      <Flex bg="$surface1" gap="$spacing8" pb="$spacing16" px="$spacing24">
        <AccountHeader />
        <Flex pb="$spacing8">
          <PortfolioBalance owner={activeAccount.address} />
        </Flex>
        {isSignerAccount ? (
          <QuickActions actions={actions} sentry-label="QuickActions" />
        ) : (
          <Flex centered row bg="$surface2" br="$rounded12" minHeight={40} p="$spacing8">
            <Text allowFontScaling={false} color="$neutral2" variant="body2">
              {viewOnlyLabel}
            </Text>
          </Flex>
        )}
        {unitagsFeatureFlagEnabled && <UnitagBanner />}
      </Flex>
    )
  }, [activeAccount.address, isSignerAccount, viewOnlyLabel, actions, unitagsFeatureFlagEnabled])

  const contentContainerStyle = useMemo<StyleProp<ViewStyle>>(
    () => ({
      paddingTop: headerHeight + TAB_BAR_HEIGHT + TAB_STYLES.tabListInner.paddingTop,
      paddingBottom:
        insets.bottom +
        SWAP_BUTTON_HEIGHT +
        TAB_STYLES.tabListInner.paddingBottom +
        listBottomPadding,
    }),
    [headerHeight, insets.bottom, listBottomPadding]
  )

  const loadingContainerStyle = useMemo<StyleProp<ViewStyle>>(
    () => ({
      paddingTop: headerHeight + TAB_BAR_HEIGHT + TAB_STYLES.tabListInner.paddingTop,
      paddingBottom: insets.bottom,
    }),
    [headerHeight, insets.bottom]
  )

  const emptyContainerStyle = useMemo<StyleProp<ViewStyle>>(
    () => ({
      paddingTop: media.short ? spacing.none : spacing.spacing60,
      paddingBottom: insets.bottom,
      paddingHorizontal: media.short ? spacing.spacing12 : spacing.spacing48,
    }),
    [insets.bottom, media.short]
  )

  const sharedProps = useMemo<TabContentProps>(
    () => ({
      loadingContainerStyle,
      emptyContainerStyle,
      contentContainerStyle,
      onMomentumScrollEnd: sync,
      onScrollEndDrag: sync,
      scrollEventThrottle: TAB_VIEW_SCROLL_THROTTLE,
    }),
    [contentContainerStyle, emptyContainerStyle, loadingContainerStyle, sync]
  )

  const tabBarStyle = useMemo<StyleProp<ViewStyle>>(
    () => [{ top: headerHeight }, translatedStyle],
    [headerHeight, translatedStyle]
  )

  const headerContainerStyle = useMemo<StyleProp<ViewStyle>>(
    () => [TAB_STYLES.headerContainer, { paddingTop: insets.top }, translatedStyle],
    [insets.top, translatedStyle]
  )

  const statusBarStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      currentScrollValue.value,
      [0, headerHeightDiff],
      [colors.surface1.val, colors.surface1.val]
    ),
  }))

  const renderTabBar = useCallback(
    (sceneProps: SceneRendererProps) => {
      const style = { width: 'auto' }
      return (
        <>
          <Animated.View style={headerContainerStyle} onLayout={handleHeaderLayout}>
            {contentHeader}
          </Animated.View>

          {isLayoutReady && (
            <Animated.View entering={FadeIn} style={[TAB_STYLES.header, tabBarStyle]}>
              <TabBar
                {...sceneProps}
                indicatorStyle={TAB_STYLES.activeTabIndicator}
                navigationState={{ index: tabIndex, routes }}
                pressColor={colors.surface3.val} // Android only
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
                onTabPress={async (): Promise<void> => {
                  await impactAsync()
                }}
              />
            </Animated.View>
          )}
        </>
      )
    },
    [
      colors.surface1,
      colors.surface3,
      contentHeader,
      handleHeaderLayout,
      headerContainerStyle,
      isLayoutReady,
      routes,
      tabBarStyle,
      tabIndex,
    ]
  )

  const [refreshing, setRefreshing] = useState(false)

  const onRefreshHomeData = useCallback(async () => {
    setRefreshing(true)

    await apolloClient?.refetchQueries({
      include: [
        ...TOKENS_TAB_DATA_DEPENDENCIES,
        ...NFTS_TAB_DATA_DEPENDENCIES,
        ...ACTIVITY_TAB_DATA_DEPENDENCIES,
        ...(showFeedTab ? FEED_TAB_DATA_DEPENDENCIES : []),
      ],
    })

    // Artificially delay 0.5 second to show the refresh animation
    const timeout = setTimeout(() => setRefreshing(false), 500)
    return () => clearTimeout(timeout)
  }, [showFeedTab])

  const renderTab = useCallback(
    ({
      route,
    }: {
      route: {
        key: SectionName
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
                onRefresh={onRefreshHomeData}
              />
            </Freeze>
          )
        case SectionName.HomeFeedTab:
          return (
            <FeedTab
              ref={feedTabScrollRef}
              containerProps={sharedProps}
              headerHeight={headerHeight}
              owner={activeAccount?.address}
              refreshing={refreshing}
              scrollHandler={feedTabScrollHandler}
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
      feedTabScrollRef,
      feedTabScrollHandler,
    ]
  )

  // Hides lock screen on next js render cycle, ensuring this component is loaded when the screen is hidden
  useTimeout(hideSplashScreen, 1)

  return (
    <Screen edges={['left', 'right']}>
      <View style={TAB_STYLES.container}>
        <TraceTabView
          lazy
          initialLayout={{
            height: dimensions.fullHeight,
            width: dimensions.fullWidth,
          }}
          navigationState={{ index: tabIndex, routes }}
          renderScene={renderTab}
          renderTabBar={renderTabBar}
          screenName={Screens.Home}
          onIndexChange={setTabIndex}
        />
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
  Icon: React.FC<SvgProps>
  eventName?: MobileEventName
  iconScale?: number
  label: string
  name: ElementName
  sentryLabel: string
  onPress: () => void
}

function QuickActions({ actions }: { actions: QuickAction[] }): JSX.Element {
  return (
    <Flex centered row gap="$spacing12">
      {actions.map((action) => (
        <ActionButton
          Icon={action.Icon}
          eventName={action.eventName}
          flex={1}
          iconScale={action.iconScale}
          label={action.label}
          name={action.name}
          sentry-label={action.sentryLabel}
          onPress={action.onPress}
        />
      ))}
    </Flex>
  )
}

function ActionButton({
  eventName,
  name,
  Icon,
  onPress,
  flex,
  activeScale = 0.96,
  iconScale = 1,
}: {
  eventName?: MobileEventName
  name: ElementName
  label: string
  Icon: React.FC<SvgProps>
  onPress: () => void
  flex: number
  activeScale?: number
  iconScale?: number
}): JSX.Element {
  const colors = useSporeColors()
  const scale = useSharedValue(1)
  const animatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ scale: scale.value }],
    }),
    [scale]
  )
  const media = useMedia()
  const iconSize = media.short ? iconSizes.icon24 : iconSizes.icon28
  const onGestureEvent = useAnimatedGestureHandler<TapGestureHandlerGestureEvent>({
    onStart: () => {
      cancelAnimation(scale)
      scale.value = pulseAnimation(activeScale)
    },
    onEnd: () => {
      runOnJS(onPress)()
    },
  })

  return (
    <Trace logPress element={name} pressEvent={eventName}>
      <TouchableArea hapticFeedback flex={flex} onPress={onPress}>
        <TapGestureHandler onGestureEvent={onGestureEvent}>
          <AnimatedFlex
            centered
            fill
            backgroundColor="$DEP_backgroundActionButton"
            borderRadius="$rounded20"
            p="$spacing16"
            style={animatedStyle}>
            <Icon
              color={colors.accent1.get()}
              height={iconSize * iconScale}
              strokeWidth={2}
              width={iconSize * iconScale}
            />
          </AnimatedFlex>
        </TapGestureHandler>
      </TouchableArea>
    </Trace>
  )
}

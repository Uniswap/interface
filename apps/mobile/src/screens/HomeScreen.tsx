/* eslint-disable max-lines */
import { useScrollToTop } from '@react-navigation/native'
import { FlashList } from '@shopify/flash-list'
import { useResponsiveProp } from '@shopify/restyle'
import { impactAsync } from 'expo-haptics'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleProp, View, ViewProps, ViewStyle } from 'react-native'
import { TapGestureHandler, TapGestureHandlerGestureEvent } from 'react-native-gesture-handler'
import Animated, {
  cancelAnimation,
  interpolateColor,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SvgProps } from 'react-native-svg'
import { SceneRendererProps, TabBar } from 'react-native-tab-view'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { NavBar, SWAP_BUTTON_HEIGHT } from 'src/app/navigation/NavBar'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { AccountHeader } from 'src/components/accounts/AccountHeader'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { pulseAnimation } from 'src/components/buttons/utils'
import { ActivityTab, ACTIVITY_TAB_DATA_DEPENDENCIES } from 'src/components/home/ActivityTab'
import { NftsTab, NFTS_TAB_DATA_DEPENDENCIES } from 'src/components/home/NftsTab'
import { TokensTab, TOKENS_TAB_DATA_DEPENDENCIES } from 'src/components/home/TokensTab'
import { AnimatedBox, AnimatedFlex, Box, Flex } from 'src/components/layout'
import { SHADOW_OFFSET_SMALL } from 'src/components/layout/BaseCard'
import { Delay, Delayed } from 'src/components/layout/Delayed'
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
import { Text } from 'src/components/Text'
import Trace from 'src/components/Trace/Trace'
import TraceTabView from 'src/components/Trace/TraceTabView'
import { apolloClient } from 'src/data/usePersistedApolloClient'
import { PortfolioBalance } from 'src/features/balances/PortfolioBalance'
import { openModal } from 'src/features/modals/modalSlice'
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
import BuyIcon from 'ui/src/assets/icons/buy.svg'
import ScanIcon from 'ui/src/assets/icons/scan-receive.svg'
import SendIcon from 'ui/src/assets/icons/send-action.svg'
import { dimensions } from 'ui/src/theme/restyle'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useInterval, useTimeout } from 'utilities/src/time/timing'
import { setNotificationStatus } from 'wallet/src/features/notifications/slice'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

const CONTENT_HEADER_HEIGHT_ESTIMATE = 270

export enum TabIndex {
  Tokens = 0,
  NFTs = 1,
  Activity = 2,
}

/**
 * Home Screen hosts both Tokens and NFTs Tab
 * Manages TokensTabs and NftsTab scroll offsets when header is collapsed
 * Borrowed from: https://stormotion.io/blog/how-to-create-collapsing-tab-header-using-react-native/
 */
export function HomeScreen(props?: AppStackScreenProp<Screens.Home>): JSX.Element {
  const activeAccount = useActiveAccountWithThrow()
  const { t } = useTranslation()
  const theme = useAppTheme()
  const insets = useSafeAreaInsets()
  const dispatch = useAppDispatch()

  // opens the wallet restore modal if recovery phrase is missing after the app is opened
  useWalletRestore({ openModalImmediately: true })

  // Report balances at most every 24 hours, checking every 15 seconds when app is open
  const lastBalancesReporter = useLastBalancesReporter()
  useInterval(lastBalancesReporter, ONE_SECOND_MS * 15, true)

  const listBottomPadding =
    useResponsiveProp({
      xs: theme.spacing.spacing36,
      sm: theme.spacing.spacing12,
    }) ?? 0

  const [tabIndex, setTabIndex] = useState(props?.route?.params?.tab ?? TabIndex.Tokens)
  const routes = useMemo(
    () => [
      { key: SectionName.HomeTokensTab, title: t('Tokens') },
      { key: SectionName.HomeNFTsTab, title: t('NFTs') },
      { key: SectionName.HomeActivityTab, title: t('Activity') },
    ],
    [t]
  )

  useEffect(
    function syncTabIndex() {
      const newTabIndex = props?.route.params?.tab
      if (newTabIndex === undefined) return
      setTabIndex(newTabIndex)
    },
    [props?.route.params?.tab]
  )

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

  const handleHeaderLayout = useCallback<NonNullable<ViewProps['onLayout']>>(
    (event) => setHeaderHeight(event.nativeEvent.layout.height),
    []
  )

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tokensTabScrollRef = useAnimatedRef<FlashList<any>>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nftsTabScrollRef = useAnimatedRef<FlashList<any>>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activityTabScrollRef = useAnimatedRef<FlashList<any>>()

  const currentScrollValue = useDerivedValue(() => {
    if (tabIndex === TabIndex.Tokens) {
      return tokensTabScrollValue.value
    } else if (tabIndex === TabIndex.NFTs) {
      return nftsTabScrollValue.value
    }
    return activityTabScrollValue.value
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
    nftsTabScrollRef.current?.scrollToOffset({ offset: 0, animated: true })
    tokensTabScrollRef.current?.scrollToOffset({ offset: 0, animated: true })
    activityTabScrollRef.current?.scrollToOffset({ offset: 0, animated: true })
  }, [
    activeAccount,
    activityTabScrollRef,
    activityTabScrollValue,
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
        if (currentTabIndex.value === TabIndex.NFTs && isNftTabsAtTop.value) {
          setTabIndex(TabIndex.Tokens)
        } else if (currentTabIndex.value === TabIndex.NFTs) {
          nftsTabScrollRef.current?.scrollToOffset({ offset: 0, animated: true })
        } else if (currentTabIndex.value === TabIndex.Activity && isActivityTabAtTop.value) {
          setTabIndex(TabIndex.NFTs)
        } else if (currentTabIndex.value === TabIndex.Activity) {
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
    ],
    [
      activityTabScrollRef,
      activityTabScrollValue,
      nftsTabScrollRef,
      nftsTabScrollValue,
      tokensTabScrollRef,
      tokensTabScrollValue,
    ]
  )

  const { sync } = useScrollSync(tabIndex, scrollPairs, headerConfig)

  const contentHeader = useMemo(() => {
    return (
      <Flex bg="surface1" gap="spacing16" pb="spacing16" px="spacing24">
        <Box pb="spacing12">
          <AccountHeader />
        </Box>
        <Box pb="spacing4">
          <PortfolioBalance owner={activeAccount.address} />
        </Box>
        <QuickActions sentry-label="QuickActions" />
      </Flex>
    )
  }, [activeAccount.address])

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
      paddingTop: theme.spacing.spacing60,
      paddingHorizontal: theme.spacing.spacing36,
      paddingBottom: insets.bottom,
    }),
    [insets.bottom, theme.spacing.spacing36, theme.spacing.spacing60]
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
      [theme.colors.surface1, theme.colors.surface1]
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
          <Animated.View style={[TAB_STYLES.header, tabBarStyle]}>
            <Box bg="surface1" paddingLeft="spacing12">
              <TabBar
                {...sceneProps}
                indicatorStyle={TAB_STYLES.activeTabIndicator}
                navigationState={{ index: tabIndex, routes }}
                pressColor={theme.colors.surface3} // Android only
                renderLabel={renderTabLabel}
                style={[
                  TAB_STYLES.tabBar,
                  {
                    backgroundColor: theme.colors.surface1,
                    borderBottomColor: theme.colors.surface3,
                  },
                ]}
                tabStyle={style}
                onTabPress={async (): Promise<void> => {
                  await impactAsync()
                }}
              />
            </Box>
          </Animated.View>
        </>
      )
    },
    [
      contentHeader,
      handleHeaderLayout,
      headerContainerStyle,
      routes,
      tabBarStyle,
      tabIndex,
      theme.colors.surface1,
      theme.colors.surface3,
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
      ],
    })
    // Artificially delay 0.5 second to show the refresh animation
    setTimeout(() => {
      setRefreshing(false)
    }, 500)
  }, [])

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
            <TokensTab
              ref={tokensTabScrollRef}
              containerProps={sharedProps}
              headerHeight={headerHeight}
              owner={activeAccount?.address}
              refreshing={refreshing}
              scrollHandler={tokensTabScrollHandler}
              onRefresh={onRefreshHomeData}
            />
          )
        case SectionName.HomeNFTsTab:
          return (
            <Delayed waitBeforeShow={Delay.Normal}>
              <NftsTab
                ref={nftsTabScrollRef}
                containerProps={sharedProps}
                headerHeight={headerHeight}
                owner={activeAccount?.address}
                refreshing={refreshing}
                scrollHandler={nftsTabScrollHandler}
                onRefresh={onRefreshHomeData}
              />
            </Delayed>
          )
        case SectionName.HomeActivityTab:
          return (
            <Delayed waitBeforeShow={Delay.Normal}>
              <ActivityTab
                ref={activityTabScrollRef}
                containerProps={sharedProps}
                headerHeight={headerHeight}
                owner={activeAccount?.address}
                refreshing={refreshing}
                scrollHandler={activityTabScrollHandler}
                onRefresh={onRefreshHomeData}
              />
            </Delayed>
          )
      }
      return null
    },
    [
      activeAccount?.address,
      activityTabScrollHandler,
      activityTabScrollRef,
      nftsTabScrollHandler,
      nftsTabScrollRef,
      sharedProps,
      tokensTabScrollHandler,
      tokensTabScrollRef,
      refreshing,
      onRefreshHomeData,
      headerHeight,
    ]
  )

  // Hides lock screen on next js render cycle, ensuring this component is loaded when the screen is hidden
  useTimeout(hideSplashScreen, 1)

  return (
    <Screen edges={['left', 'right']}>
      <View style={TAB_STYLES.container}>
        <TraceTabView
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
      <AnimatedBox
        height={insets.top}
        position="absolute"
        style={statusBarStyle}
        top={0}
        width="100%"
        zIndex="sticky"
      />
    </Screen>
  )
}

function QuickActions(): JSX.Element {
  const dispatch = useAppDispatch()
  const activeAccount = useActiveAccountWithThrow()
  const { t } = useTranslation()

  const onPressBuy = (): void => {
    dispatch(openModal({ name: ModalName.FiatOnRamp }))
  }
  const onPressScan = (): void => {
    // in case we received a pending session from a previous scan after closing modal
    dispatch(removePendingSession())
    dispatch(
      openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.ScanQr })
    )
  }
  const onPressSend = (): void => {
    dispatch(openModal({ name: ModalName.Send }))
  }

  // hide fiat onramp banner when active account isn't a signer account.
  const showFiatOnRamp = activeAccount.type === AccountType.SignerMnemonic

  return (
    <Flex centered row gap="spacing8">
      {showFiatOnRamp ? (
        <ActionButton
          Icon={BuyIcon}
          eventName={MobileEventName.FiatOnRampQuickActionButtonPressed}
          flex={1}
          label={t('Buy')}
          name={ElementName.Buy}
          sentry-label="BuyActionButton"
          onPress={onPressBuy}
        />
      ) : null}
      <ActionButton
        Icon={SendIcon}
        flex={1}
        label={t('Send')}
        name={ElementName.Send}
        sentry-label="SendActionButton"
        onPress={onPressSend}
      />
      <ActionButton
        Icon={ScanIcon}
        flex={1}
        label={t('Scan')}
        name={ElementName.WalletConnectScan}
        sentry-label="ScanActionButton"
        onPress={onPressScan}
      />
    </Flex>
  )
}

function ActionButton({
  eventName,
  name,
  label,
  Icon,
  onPress,
  flex,
  activeScale = 0.96,
}: {
  eventName?: MobileEventName
  name: ElementName
  label: string
  Icon: React.FC<SvgProps>
  onPress: () => void
  flex: number
  activeScale?: number
}): JSX.Element {
  const theme = useAppTheme()
  const scale = useSharedValue(1)
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }), [scale])

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
            row
            backgroundColor="DEP_backgroundActionButton"
            borderRadius="roundedFull"
            gap="none"
            px="spacing12"
            py="spacing16"
            shadowColor="sporeWhite"
            shadowOffset={SHADOW_OFFSET_SMALL}
            shadowOpacity={0.1}
            shadowRadius={6}
            style={animatedStyle}>
            <Icon
              color={theme.colors.accent1}
              height={theme.iconSizes.icon20}
              strokeWidth={2}
              width={theme.iconSizes.icon20}
            />
            <Text color="accent1" marginLeft="spacing8" variant="buttonLabelMedium">
              {label}
            </Text>
          </AnimatedFlex>
        </TapGestureHandler>
      </TouchableArea>
    </Trace>
  )
}

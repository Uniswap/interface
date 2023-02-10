import {
  BottomTabBar,
  BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs'
import { HeaderTitleProps } from '@react-navigation/elements'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createStackNavigator } from '@react-navigation/stack'
import { NavigationRoute } from '@sentry/react-native/dist/js/tracing/reactnavigation'
import { useResponsiveProp } from '@shopify/restyle'
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import {
  SwapTabBarButton,
  TabBarButton,
  TAB_NAVIGATOR_HEIGHT_SM,
  TAB_NAVIGATOR_HEIGHT_XS,
} from 'src/app/navigation/TabBar'
import {
  AppStackParamList,
  ExploreStackParamList,
  HomeStackParamList,
  OnboardingStackParamList,
  SettingsStackParamList,
  TabParamList,
} from 'src/app/navigation/types'
import SearchIconFocused from 'src/assets/icons/search-focused.svg'
import SearchIcon from 'src/assets/icons/search.svg'
import WalletIconFilled from 'src/assets/icons/wallet-filled.svg'
import WalletIcon from 'src/assets/icons/wallet.svg'
import { Chevron } from 'src/components/icons/Chevron'
import { Box } from 'src/components/layout'
import { TokenDetailsPreloaders } from 'src/data/preload/TokenDetailsPreloader'
import { useLowPriorityPreloadedQueries } from 'src/data/preload/useLowPriorityPreloadedQueries'
import { usePreloadedHomeScreenQueries } from 'src/data/preload/usePreloadedHomeScreenQueries'
import { useBiometricCheck } from 'src/features/biometrics/useBiometricCheck'
import { useHighestBalanceNativeCurrencyId } from 'src/features/dataApi/balances'
import { openModal } from 'src/features/modals/modalSlice'
import { OnboardingHeader } from 'src/features/onboarding/OnboardingHeader'
import { OnboardingEntryPoint } from 'src/features/onboarding/utils'
import { ModalName } from 'src/features/telemetry/constants'
import {
  selectActiveAccount,
  selectFinishedOnboarding,
  selectReplaceAccountOptions,
} from 'src/features/wallet/selectors'
import { ActivityScreen } from 'src/screens/ActivityScreen'
import { DevScreen } from 'src/screens/DevScreen'
import { EducationScreen } from 'src/screens/EducationScreen'
import { ExploreScreen } from 'src/screens/ExploreScreen'
import { ExternalProfileScreen } from 'src/screens/ExternalProfileScreen'
import { HomeScreen } from 'src/screens/HomeScreen'
import { ImportMethodScreen } from 'src/screens/Import/ImportMethodScreen'
import { RestoreCloudBackupLoadingScreen } from 'src/screens/Import/RestoreCloudBackupLoadingScreen'
import { RestoreCloudBackupPasswordScreen } from 'src/screens/Import/RestoreCloudBackupPasswordScreen'
import { RestoreCloudBackupScreen } from 'src/screens/Import/RestoreCloudBackupScreen'
import { SeedPhraseInputScreen } from 'src/screens/Import/SeedPhraseInputScreen'
import { SelectWalletScreen } from 'src/screens/Import/SelectWalletScreen'
import { WatchWalletScreen } from 'src/screens/Import/WatchWalletScreen'
import { NFTCollectionScreen } from 'src/screens/NFTCollectionScreen'
import { NFTItemScreen } from 'src/screens/NFTItemScreen'
import { BackupScreen } from 'src/screens/Onboarding/BackupScreen'
import { CloudBackupPasswordScreen } from 'src/screens/Onboarding/CloudBackupPasswordScreen'
import { CloudBackupProcessingScreen } from 'src/screens/Onboarding/CloudBackupProcessingScreen'
import { EditNameScreen } from 'src/screens/Onboarding/EditNameScreen'
import { LandingScreen } from 'src/screens/Onboarding/LandingScreen'
import { ManualBackupScreen } from 'src/screens/Onboarding/ManualBackupScreen'
import { NotificationsSetupScreen } from 'src/screens/Onboarding/NotificationsSetupScreen'
import { OutroScreen } from 'src/screens/Onboarding/OutroScreen'
import { SecuritySetupScreen } from 'src/screens/Onboarding/SecuritySetupScreen'
import { OnboardingScreens, Screens, Tabs } from 'src/screens/Screens'
import { SettingsBiometricAuthScreen } from 'src/screens/SettingsBiometricAuthScreen'
import { SettingsChainsScreen } from 'src/screens/SettingsChainsScreen'
import { SettingsCloudBackupScreen } from 'src/screens/SettingsCloudBackupScreen'
import { SettingsCloudBackupStatus } from 'src/screens/SettingsCloudBackupStatus'
import { SettingsScreen } from 'src/screens/SettingsScreen'
import { SettingsTestConfigs } from 'src/screens/SettingsTestConfigs'
import { SettingsViewSeedPhraseScreen } from 'src/screens/SettingsViewSeedPhraseScreen'
import { SettingsWallet } from 'src/screens/SettingsWallet'
import { SettingsWalletEdit } from 'src/screens/SettingsWalletEdit'
import { SettingsWalletManageConnection } from 'src/screens/SettingsWalletManageConnection'
import { TokenDetailsScreen } from 'src/screens/TokenDetailsScreen'
import { WebViewScreen } from 'src/screens/WebViewScreen'
import { invokeImpact } from 'src/utils/haptic'

const Tab = createBottomTabNavigator<TabParamList>()
const OnboardingStack = createStackNavigator<OnboardingStackParamList>()
const AppStack = createNativeStackNavigator<AppStackParamList>()
const HomeStack = createNativeStackNavigator<HomeStackParamList>()
const ExploreStack = createNativeStackNavigator<ExploreStackParamList>()
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>()

const NullComponent = (): null => {
  return null
}

const renderTabBar = (props: BottomTabBarProps): JSX.Element => (
  <Box bottom={0} left={0} position="absolute" right={0}>
    <BottomTabBar {...props} />
  </Box>
)

const renderTabBarWalletIcon = ({ focused }: { focused: boolean }): JSX.Element => (
  <TabBarButton
    Icon={WalletIcon}
    IconFilled={WalletIconFilled}
    focused={focused}
    // swap takes `xxs` more space than other buttons
    pl="spacing24"
  />
)

const renderTabBarSearchIcon = ({ focused }: { focused: boolean }): JSX.Element => (
  <TabBarButton
    Icon={SearchIcon}
    IconFilled={SearchIconFocused}
    focused={focused}
    // swap takes `xxs` more space than other buttons
    pr="spacing24"
  />
)

const renderSwapTabBarButton = (): JSX.Element => {
  return <SwapTabBarButton />
}

const renderSwapTabBarButtonWithInputCurrency =
  (activeAccountAddress: Address) => (): JSX.Element => {
    // We do it here and not inside SwapModal for two reasons:
    // 1) To avoid flickering and/or rendering delays in SwapModal
    // 2) When we open SwapModal from other places we pass input currency inside modal's initialState.
    //    Inside SwapTabBarButton we do it the same way to avoid additional complexity.
    const inputCurrencyId = useHighestBalanceNativeCurrencyId(activeAccountAddress)
    return <SwapTabBarButton inputCurrencyId={inputCurrencyId} />
  }

function TabNavigator(): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  useBiometricCheck()
  const TAB_NAVIGATOR_HEIGHT =
    useResponsiveProp({
      xs: TAB_NAVIGATOR_HEIGHT_XS,
      sm: TAB_NAVIGATOR_HEIGHT_SM,
    }) ?? TAB_NAVIGATOR_HEIGHT_SM

  useLowPriorityPreloadedQueries()

  const activeAccount = useAppSelector(selectActiveAccount)

  return (
    <>
      <Tab.Navigator
        sceneContainerStyle={{ paddingBottom: TAB_NAVIGATOR_HEIGHT }}
        screenOptions={{
          tabBarActiveTintColor: theme.colors.textPrimary,
          tabBarInactiveTintColor: theme.colors.textTertiary,
          tabBarShowLabel: false,
          headerShown: false,
          tabBarStyle: {
            alignItems: 'center',
            paddingBottom: 0,
            backgroundColor: 'textPrimary',
            borderTopWidth: 1,
            display: 'flex',
            borderTopColor: theme.colors.background3,
            height: TAB_NAVIGATOR_HEIGHT,
            justifyContent: 'center',
          },
        }}
        tabBar={renderTabBar}>
        <Tab.Screen
          component={HomeStackNavigator}
          listeners={({ navigation }): { tabPress: () => void; tabLongPress: () => void } => ({
            tabPress: (): void => invokeImpact[ImpactFeedbackStyle.Medium](),
            tabLongPress: (): void => {
              const currentIndex = navigation.getState().index
              const homeTabIndex = navigation
                .getState()
                .routes.findIndex((r: NavigationRoute) => r.name === Tabs.Home)

              if (currentIndex === homeTabIndex) {
                impactAsync(ImpactFeedbackStyle.Heavy)
                dispatch(openModal({ name: ModalName.AccountSwitcher }))
              }
            },
          })}
          name={Tabs.Home}
          options={{
            tabBarLabel: t('Home'),
            tabBarIcon: renderTabBarWalletIcon,
          }}
        />
        <Tab.Screen
          component={NullComponent}
          name={Tabs.SwapButton}
          options={{
            tabBarButton: activeAccount
              ? renderSwapTabBarButtonWithInputCurrency(activeAccount.address)
              : renderSwapTabBarButton,
          }}
        />
        <Tab.Screen
          component={ExploreStackNavigator}
          listeners={{
            tabPress: (): void => invokeImpact[ImpactFeedbackStyle.Medium](),
          }}
          name={Tabs.Explore}
          options={{
            tabBarLabel: t('Explore'),
            tabBarShowLabel: false,
            tabBarIcon: renderTabBarSearchIcon,
          }}
        />
      </Tab.Navigator>
      <TokenDetailsPreloaders />
    </>
  )
}

function SettingsStackGroup(): JSX.Element {
  return (
    <SettingsStack.Navigator screenOptions={navOptions.noHeader}>
      <SettingsStack.Screen component={SettingsScreen} name={Screens.Settings} />
      <SettingsStack.Screen component={SettingsWallet} name={Screens.SettingsWallet} />
      <SettingsStack.Screen component={SettingsWalletEdit} name={Screens.SettingsWalletEdit} />
      <SettingsStack.Screen
        component={SettingsWalletManageConnection}
        name={Screens.SettingsWalletManageConnection}
      />
      <SettingsStack.Screen component={WebViewScreen} name={Screens.WebView} />
      <SettingsStack.Screen component={SettingsChainsScreen} name={Screens.SettingsChains} />
      <SettingsStack.Screen component={SettingsTestConfigs} name={Screens.SettingsTestConfigs} />
      <SettingsStack.Screen component={DevScreen} name={Screens.Dev} />
      <SettingsStack.Screen
        component={SettingsBiometricAuthScreen}
        name={Screens.SettingsBiometricAuth}
      />
      <SettingsStack.Screen
        component={SettingsViewSeedPhraseScreen}
        name={Screens.SettingsViewSeedPhrase}
      />
      <SettingsStack.Screen
        component={SettingsCloudBackupScreen}
        name={Screens.SettingsCloudBackupScreen}
      />
      <SettingsStack.Screen
        component={SettingsCloudBackupStatus}
        name={Screens.SettingsCloudBackupStatus}
      />
    </SettingsStack.Navigator>
  )
}

export function HomeStackNavigator(): JSX.Element {
  return (
    <HomeStack.Navigator
      initialRouteName={Screens.Home}
      screenOptions={{
        ...navOptions.noHeader,
      }}>
      <HomeStack.Screen component={HomeScreen} name={Screens.Home} />
    </HomeStack.Navigator>
  )
}

export function ExploreStackNavigator(): JSX.Element {
  return (
    <ExploreStack.Navigator
      initialRouteName={Screens.Explore}
      screenOptions={{
        ...navOptions.noHeader,
      }}>
      <ExploreStack.Screen component={ExploreScreen} name={Screens.Explore} />
    </ExploreStack.Navigator>
  )
}

const renderHeaderTitle = (props: HeaderTitleProps): JSX.Element => <OnboardingHeader {...props} />
const renderEmptyBackImage = (): JSX.Element => <></>

export function OnboardingStackNavigator(): JSX.Element {
  const theme = useAppTheme()
  const insets = useSafeAreaInsets()
  const replaceAccountOptions = useAppSelector(selectReplaceAccountOptions)

  const renderHeaderBackImage = useCallback(
    () => <Chevron color={theme.colors.textSecondary} height={28} width={28} />,
    [theme.colors.textSecondary]
  )

  return (
    <OnboardingStack.Navigator>
      <OnboardingStack.Group
        screenOptions={{
          headerMode: 'float',
          headerTitle: renderHeaderTitle,
          headerBackTitleVisible: false,
          headerBackImage: renderHeaderBackImage,
          headerStatusBarHeight: insets.top + theme.spacing.spacing8,
          headerTransparent: true,
          headerTintColor: theme.colors.textSecondary,
          headerLeftContainerStyle: { paddingLeft: theme.spacing.spacing16 },
          headerRightContainerStyle: { paddingRight: theme.spacing.spacing16 },
        }}>
        <OnboardingStack.Screen
          component={LandingScreen}
          initialParams={{
            shouldSkipToSeedPhraseInput: replaceAccountOptions?.skipToSeedPhrase,
          }}
          name={OnboardingScreens.Landing}
          options={{ headerShown: false }}
        />
        <OnboardingStack.Screen component={EditNameScreen} name={OnboardingScreens.EditName} />
        <OnboardingStack.Screen component={BackupScreen} name={OnboardingScreens.Backup} />
        <OnboardingStack.Screen
          component={NotificationsSetupScreen}
          name={OnboardingScreens.Notifications}
        />
        <OnboardingStack.Screen component={SecuritySetupScreen} name={OnboardingScreens.Security} />
        <OnboardingStack.Screen
          component={ManualBackupScreen}
          name={OnboardingScreens.BackupManual}
        />
        <OnboardingStack.Screen
          component={OutroScreen}
          name={OnboardingScreens.Outro}
          // There should be no header shown on this screen but if headerShown: false and the user is adding a wallet from the
          // sidebar then when this screen is navigated away from the header will reappear on the home screen on top of the account
          // header.
          // To fix this the header is shown but the backImage is hidden so it appears as if there is no header. This is v hacky but
          // I think it's a react navigation bug and I couldn't find a better solution. Feel free to debug if you're bored.
          options={{
            headerShown: true,
            gestureEnabled: false,
            headerBackImage: renderEmptyBackImage,
          }}
        />
        <OnboardingStack.Screen
          component={CloudBackupProcessingScreen}
          name={OnboardingScreens.BackupCloudProcessing}
        />
        <OnboardingStack.Screen
          component={CloudBackupPasswordScreen}
          name={OnboardingScreens.BackupCloudPassword}
        />
        <OnboardingStack.Screen
          component={ImportMethodScreen}
          name={OnboardingScreens.ImportMethod}
        />
        <OnboardingStack.Screen
          component={RestoreCloudBackupLoadingScreen}
          name={OnboardingScreens.RestoreCloudBackupLoading}
        />
        <OnboardingStack.Screen
          component={RestoreCloudBackupScreen}
          name={OnboardingScreens.RestoreCloudBackup}
        />
        <OnboardingStack.Screen
          component={RestoreCloudBackupPasswordScreen}
          name={OnboardingScreens.RestoreCloudBackupPassword}
        />
        <OnboardingStack.Screen
          component={SeedPhraseInputScreen}
          name={OnboardingScreens.SeedPhraseInput}
        />
        <OnboardingStack.Screen
          component={SelectWalletScreen}
          name={OnboardingScreens.SelectWallet}
        />
        <OnboardingStack.Screen
          component={WatchWalletScreen}
          name={OnboardingScreens.WatchWallet}
        />
      </OnboardingStack.Group>
    </OnboardingStack.Navigator>
  )
}

export function AppStackNavigator(): JSX.Element {
  const finishedOnboarding = useAppSelector(selectFinishedOnboarding)
  const replaceAccountOptions = useAppSelector(selectReplaceAccountOptions)

  // preload home screen queries before `finishedOnboarding` is truthy
  // this helps load the home screen fast from a fresh install
  usePreloadedHomeScreenQueries()
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      {finishedOnboarding && !replaceAccountOptions?.isReplacingAccount && (
        <AppStack.Screen component={TabNavigator} name={Screens.TabNavigator} />
      )}
      <AppStack.Screen
        component={OnboardingStackNavigator}
        name={Screens.OnboardingStack}
        navigationKey={
          finishedOnboarding
            ? replaceAccountOptions?.isReplacingAccount
              ? OnboardingEntryPoint.Sidebar.valueOf()
              : OnboardingEntryPoint.ReplaceAccount.valueOf()
            : OnboardingEntryPoint.FreshInstall.valueOf()
        }
      />
      <AppStack.Screen component={ExternalProfileScreen} name={Screens.ExternalProfile} />
      <AppStack.Screen component={TokenDetailsScreen} name={Screens.TokenDetails} />
      <AppStack.Screen component={NFTItemScreen} name={Screens.NFTItem} />
      <AppStack.Screen component={NFTCollectionScreen} name={Screens.NFTCollection} />
      <AppStack.Screen component={ActivityScreen} name={Screens.Activity} />
      <AppStack.Screen component={WebViewScreen} name={Screens.WebView} />
      <AppStack.Screen component={SettingsStackGroup} name={Screens.SettingsStack} />
      <AppStack.Screen
        component={SettingsWalletManageConnection}
        name={Screens.SettingsWalletManageConnection}
      />
      <AppStack.Group screenOptions={navOptions.presentationModal}>
        <AppStack.Screen component={EducationScreen} name={Screens.Education} />
      </AppStack.Group>
    </AppStack.Navigator>
  )
}

const navOptions = {
  noHeader: { headerShown: false },
  presentationModal: { presentation: 'modal' },
} as const

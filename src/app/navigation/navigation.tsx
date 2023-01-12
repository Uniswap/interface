import {
  BottomTabBar,
  BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs'
import { createDrawerNavigator, DrawerContentComponentProps } from '@react-navigation/drawer'
import { HeaderTitleProps } from '@react-navigation/elements'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createStackNavigator } from '@react-navigation/stack'
import { useResponsiveProp } from '@shopify/restyle'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppSelector, useAppTheme } from 'src/app/hooks'
import { AccountDrawer } from 'src/app/navigation/AccountDrawer'
import {
  useLowPriorityPreloadedQueries,
  usePreloadedHomeScreenQueries,
} from 'src/app/navigation/hooks'
import { navigationRef } from 'src/app/navigation/NavigationContainer'
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
import { useBiometricCheck } from 'src/features/biometrics/useBiometricCheck'
import { OnboardingHeader } from 'src/features/onboarding/OnboardingHeader'
import { OnboardingEntryPoint } from 'src/features/onboarding/utils'
import { selectFinishedOnboarding } from 'src/features/wallet/selectors'
import { ActivityScreen } from 'src/screens/ActivityScreen'
import { DevScreen } from 'src/screens/DevScreen'
import { EducationScreen } from 'src/screens/EducationScreen'
import { ExploreScreen } from 'src/screens/ExploreScreen'
import { ExternalProfileScreen } from 'src/screens/ExternalProfileScreen'
import { HiddenTokensScreen } from 'src/screens/HiddenTokensScreen'
import { HomeScreen } from 'src/screens/HomeScreen'
import { ImportMethodScreen } from 'src/screens/Import/ImportMethodScreen'
import { RestoreCloudBackupLoadingScreen } from 'src/screens/Import/RestoreCloudBackupLoadingScreen'
import { RestoreCloudBackupPasswordScreen } from 'src/screens/Import/RestoreCloudBackupPasswordScreen'
import { RestoreCloudBackupScreen } from 'src/screens/Import/RestoreCloudBackupScreen'
import { SeedPhraseInputScreen } from 'src/screens/Import/SeedPhraseInputScreen'
import { SelectWalletScreen } from 'src/screens/Import/SelectWalletScreen'
import { WatchWalletScreen } from 'src/screens/Import/WatchWalletScreen'
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
import { OnboardingScreens, Screens, Stacks, Tabs } from 'src/screens/Screens'
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
import { dimensions } from 'src/styles/sizing'
import { darkTheme } from 'src/styles/theme'

const Tab = createBottomTabNavigator<TabParamList>()
const OnboardingStack = createStackNavigator<OnboardingStackParamList>()
const AppStack = createNativeStackNavigator<AppStackParamList>()
const HomeStack = createNativeStackNavigator<HomeStackParamList>()
const ExploreStack = createNativeStackNavigator<ExploreStackParamList>()
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>()

const Drawer = createDrawerNavigator()

const NullComponent = () => {
  return null
}

const renderTabBar = (props: BottomTabBarProps) => (
  <Box bottom={0} left={0} position="absolute" right={0}>
    <BottomTabBar {...props} />
  </Box>
)
const renderTabBarWalletIcon = ({ focused }: { focused: boolean }) => (
  <TabBarButton
    Icon={WalletIcon}
    IconFilled={WalletIconFilled}
    focused={focused}
    // swap takes `xxs` more space than other buttons
    pl="lg"
  />
)
const renderTabBarSearchIcon = ({ focused }: { focused: boolean }) => (
  <TabBarButton
    Icon={SearchIcon}
    IconFilled={SearchIconFocused}
    focused={focused}
    // swap takes `xxs` more space than other buttons
    pr="lg"
  />
)
const renderSwapTabBarButton = () => <SwapTabBarButton />

function TabNavigator() {
  const { t } = useTranslation()
  const theme = useAppTheme()
  useBiometricCheck()
  const TAB_NAVIGATOR_HEIGHT =
    useResponsiveProp({
      xs: TAB_NAVIGATOR_HEIGHT_XS,
      sm: TAB_NAVIGATOR_HEIGHT_SM,
    }) ?? TAB_NAVIGATOR_HEIGHT_SM

  useLowPriorityPreloadedQueries()

  return (
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
          tabBarButton: renderSwapTabBarButton,
        }}
      />
      <Tab.Screen
        component={ExploreStackNavigator}
        name={Tabs.Explore}
        options={{
          tabBarLabel: t('Explore'),
          tabBarShowLabel: false,
          tabBarIcon: renderTabBarSearchIcon,
        }}
      />
    </Tab.Navigator>
  )
}

function SettingsStackGroup() {
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

const renderAccountDrawerContent = (props: DrawerContentComponentProps) => (
  <AccountDrawer {...props} />
)

export function DrawerNavigator() {
  return (
    <Drawer.Navigator
      // useLegacyImplementation seems to fix a bug with the drawer sometimes opening or
      // closing twice, or sometimes not opening the first time you tap on it
      // https://stackoverflow.com/questions/71703096/drawer-reopen-sometime-when-change-screen
      useLegacyImplementation
      drawerContent={renderAccountDrawerContent}
      screenOptions={{
        drawerStyle: {
          width: SIDEBAR_WIDTH,
        },
        headerShown: false,
        overlayColor: darkTheme.colors.backgroundScrim,
      }}>
      <Drawer.Screen
        component={AppStackNavigator}
        name={Stacks.AppStack}
        options={() => ({
          swipeEnabled: getDrawerEnabled(),
          swipeEdgeWidth: SWIPE_WIDTH,
        })}
      />
    </Drawer.Navigator>
  )
}

function getDrawerEnabled() {
  if (!navigationRef.isReady()) {
    return false
  }

  const routeName = navigationRef.getCurrentRoute()?.name
  return routeName ? DRAWER_ENABLED_SCREENS.includes(routeName) : false
}

export function HomeStackNavigator() {
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

export function ExploreStackNavigator() {
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

const renderHeaderTitle = (props: HeaderTitleProps) => <OnboardingHeader {...props} />
const renderEmptyBackImage = () => <></>

export function OnboardingStackNavigator() {
  const theme = useAppTheme()
  const insets = useSafeAreaInsets()

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
          headerStatusBarHeight: insets.top + theme.spacing.xs,
          headerTransparent: true,
          headerTintColor: theme.colors.textSecondary,
          headerLeftContainerStyle: { paddingLeft: theme.spacing.md },
          headerRightContainerStyle: { paddingRight: theme.spacing.md },
        }}>
        <OnboardingStack.Screen
          component={LandingScreen}
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

export function AppStackNavigator() {
  const finishedOnboarding = useAppSelector(selectFinishedOnboarding)

  // preload home screen queries before `finishedOnboarding` is truthy
  // this helps load the home screen fast from a fresh install
  usePreloadedHomeScreenQueries()

  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      {finishedOnboarding && (
        <AppStack.Screen component={TabNavigator} name={Screens.TabNavigator} />
      )}
      <AppStack.Screen
        component={OnboardingStackNavigator}
        name={Screens.OnboardingStack}
        navigationKey={
          finishedOnboarding
            ? OnboardingEntryPoint.Sidebar.valueOf()
            : OnboardingEntryPoint.FreshInstall.valueOf()
        }
      />
      <AppStack.Screen component={ExternalProfileScreen} name={Screens.ExternalProfile} />
      <AppStack.Screen component={HiddenTokensScreen} name={Screens.HiddenTokens} />
      <AppStack.Screen component={TokenDetailsScreen} name={Screens.TokenDetails} />
      <AppStack.Screen component={NFTItemScreen} name={Screens.NFTItem} />
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

// These should remain enabled to support swipe to close. But to prevent swipe to open set SIDEBAR_WIDTH to 0.
const DRAWER_ENABLED_SCREENS = [
  Screens.Home.valueOf(),
  Screens.Explore.valueOf(),
  Tabs.Explore.valueOf(),
]
const SIDEBAR_WIDTH = Math.min(dimensions.fullWidth * 0.8, 320)
const SWIPE_WIDTH = dimensions.fullWidth * 0.125

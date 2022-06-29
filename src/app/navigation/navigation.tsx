import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createDrawerNavigator } from '@react-navigation/drawer'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createStackNavigator } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector, useAppTheme } from 'src/app/hooks'
import { AccountDrawer } from 'src/app/navigation/AccountDrawer'
import {
  AccountStackParamList,
  AppStackParamList,
  ExploreStackParamList,
  HomeStackParamList,
  OnboardingStackParamList,
  ProfileStackParamList,
  SettingsStackParamList,
  TabParamList,
} from 'src/app/navigation/types'
import DiscoverIcon from 'src/assets/icons/discover.svg'
import ProfileIcon from 'src/assets/icons/profile.svg'
import WalletIcon from 'src/assets/icons/wallet.svg'
import OnboardingHeader from 'src/features/onboarding/OnboardingHeader'
import { selectFinishedOnboarding } from 'src/features/wallet/selectors'
import { CurrencySelectorScreen } from 'src/screens/CurrencySelectorScreen'
import { DevScreen } from 'src/screens/DevScreen'
import { EducationScreen } from 'src/screens/EducationScreen'
import { ExploreFavoritesScreen } from 'src/screens/ExploreFavoritesScreen'
import { ExploreScreen } from 'src/screens/ExploreScreen'
import { ExploreTokensScreen } from 'src/screens/ExploreTokensScreen'
import { HomeScreen } from 'src/screens/HomeScreen'
import { ImportMethodScreen } from 'src/screens/Import/ImportMethodScreen'
import { PrivateKeyInputScreen } from 'src/screens/Import/PrivateKeyInputScreen'
import { RestoreWalletScreen } from 'src/screens/Import/RestoreWalletScreen'
import { SeedPhraseInputScreen } from 'src/screens/Import/SeedPhraseInputScreen'
import { SelectWalletScreen } from 'src/screens/Import/SelectWalletScreen'
import { WatchWalletScreen } from 'src/screens/Import/WatchWalletScreen'
import { ImportAccountScreen } from 'src/screens/ImportAccountScreen'
import { LedgerScreen } from 'src/screens/LedgerScreen'
import { NFTCollectionScreen } from 'src/screens/NFTCollectionScreen'
import { NFTItemScreen } from 'src/screens/NFTItemScreen'
import { NotificationsScreen } from 'src/screens/NotificationsScreen'
import { BackupScreen } from 'src/screens/Onboarding/BackupScreen'
import { CloudBackupProcessingScreen } from 'src/screens/Onboarding/CloudBackupProcessingScreen'
import { CloudBackupScreen } from 'src/screens/Onboarding/CloudBackupScreen'
import { EditNameScreen } from 'src/screens/Onboarding/EditNameScreen'
import { LandingScreen } from 'src/screens/Onboarding/LandingScreen'
import { ManualBackupScreen } from 'src/screens/Onboarding/ManualBackupScreen'
import { NotificationsSetupScreen } from 'src/screens/Onboarding/NotificationsSetupScreen'
import { OutroScreen } from 'src/screens/Onboarding/OutroScreen'
import { SecuritySetupScreen } from 'src/screens/Onboarding/SecuritySetupScreen'
import { SelectColorScreen } from 'src/screens/Onboarding/SelectColorScreen'
import { PortfolioNFTsScreen } from 'src/screens/PortfolioNFTsScreen'
import { PortfolioTokensScreen } from 'src/screens/PortfolioTokensScreen'
import { ProfileScreen } from 'src/screens/ProfileScreen'
import { RecipientSelectoScreen } from 'src/screens/RecipientSelectorScreen'
import { OnboardingScreens, Screens, Tabs } from 'src/screens/Screens'
import { SettingsChainsScreen } from 'src/screens/SettingsChainsScreen'
import { SettingsScreen } from 'src/screens/SettingsScreen'
import { SettingsSupportScreen } from 'src/screens/SettingsSupportScreen'
import { SettingsTestConfigs } from 'src/screens/SettingsTestConfigs'
import { SettingsWallet } from 'src/screens/SettingsWallet'
import { SettingsWalletEdit } from 'src/screens/SettingsWalletEdit'
import { SettingsWalletManageConnection } from 'src/screens/SettingsWalletManageConnection'
import { TokenDetailsScreen } from 'src/screens/TokenDetailsScreen'
import { TransferTokenScreen } from 'src/screens/TransferTokenScreen'
import { UserScreen } from 'src/screens/UserScreen'
import { WebViewScreen } from 'src/screens/WebViewScreen'
import { dimensions } from 'src/styles/sizing'

const Tab = createBottomTabNavigator<TabParamList>()
const OnboardingStack = createStackNavigator<OnboardingStackParamList>()
const AppStack = createNativeStackNavigator<AppStackParamList>()
const HomeStack = createNativeStackNavigator<HomeStackParamList>()
const ExploreStack = createNativeStackNavigator<ExploreStackParamList>()
const AccountStack = createNativeStackNavigator<AccountStackParamList>()
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>()
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>()

const Drawer = createDrawerNavigator()

function TabNavigator() {
  const { t } = useTranslation()
  const theme = useAppTheme()
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.textPrimary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarShowLabel: false,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.mainBackground,
          borderTopColor: theme.colors.backgroundOutline,
          paddingBottom: 16,
        },
      }}>
      <Tab.Screen
        component={HomeStackNavigator}
        name={Tabs.Home}
        options={{
          tabBarLabel: t('Home'),
          tabBarIcon: ({ color }) => <WalletIcon color={color} height={24} />,
        }}
      />
      <Tab.Screen
        component={ExploreStackNavigator}
        name={Tabs.Explore}
        options={{
          tabBarLabel: t('Explore'),
          tabBarShowLabel: false,
          tabBarIcon: ({ color }) => <DiscoverIcon color={color} height={24} />,
        }}
      />
      <Tab.Screen
        component={ProfileScreen}
        name={Tabs.Profile}
        options={{
          tabBarLabel: t('Me'),
          tabBarIcon: ({ color }) => <ProfileIcon color={color} height={24} />,
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
      <SettingsStack.Screen component={SettingsSupportScreen} name={Screens.SettingsSupport} />
      <SettingsStack.Screen component={SettingsTestConfigs} name={Screens.SettingsTestConfigs} />
      <SettingsStack.Screen component={DevScreen} name={Screens.Dev} />
    </SettingsStack.Navigator>
  )
}

function ProfileStackGroup() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        gestureEnabled: false,
      }}>
      <ProfileStack.Screen component={PortfolioTokensScreen} name={Screens.PortfolioTokens} />
      <ProfileStack.Screen component={PortfolioNFTsScreen} name={Screens.PortfolioNFTs} />
    </ProfileStack.Navigator>
  )
}

export function DrawerNavigator() {
  const theme = useAppTheme()
  return (
    <Drawer.Navigator
      drawerContent={(props) => <AccountDrawer {...props} />}
      screenOptions={{
        drawerStyle: {
          width: dimensions.fullWidth - theme.spacing.xxl,
        },
      }}>
      <Drawer.Screen
        component={AppStackNavigator}
        name="AppStack"
        options={{
          headerShown: false,
        }}
      />
    </Drawer.Navigator>
  )
}

export function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      initialRouteName={Screens.Home}
      screenOptions={{
        ...navOptions.noHeader,
      }}>
      {/* <AppBackground /> */}
      <HomeStack.Screen component={HomeScreen} name={Screens.Home} />

      {/* Tokens */}
      <HomeStack.Screen component={PortfolioTokensScreen} name={Screens.PortfolioTokens} />
      <HomeStack.Screen component={TokenDetailsScreen} name={Screens.TokenDetails} />

      {/* NFTS */}
      <HomeStack.Screen component={PortfolioNFTsScreen} name={Screens.PortfolioNFTs} />
      <HomeStack.Screen component={NFTItemScreen} name={Screens.NFTItem} />
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
      <ExploreStack.Screen component={ExploreTokensScreen} name={Screens.ExploreTokens} />
      <ExploreStack.Screen component={ExploreFavoritesScreen} name={Screens.ExploreFavorites} />
      <ExploreStack.Screen component={TokenDetailsScreen} name={Screens.TokenDetails} />
      <ExploreStack.Screen component={UserScreen} name={Screens.User} />
      <ExploreStack.Screen component={PortfolioNFTsScreen} name={Screens.PortfolioNFTs} />
      <ExploreStack.Screen component={NFTItemScreen} name={Screens.NFTItem} />
      <ExploreStack.Screen component={PortfolioTokensScreen} name={Screens.PortfolioTokens} />
    </ExploreStack.Navigator>
  )
}

export function OnboardingStackNavigator() {
  const theme = useAppTheme()
  return (
    <OnboardingStack.Navigator>
      <OnboardingStack.Group
        screenOptions={{
          headerMode: 'float',
          headerTitle: (props) => <OnboardingHeader {...props} />,
          headerBackTitleVisible: false,
          headerStyle: {
            backgroundColor: theme.colors.mainBackground,
            shadowColor: theme.colors.none,
          },
          headerTintColor: theme.colors.textSecondary,
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
        <OnboardingStack.Screen component={OutroScreen} name={OnboardingScreens.Outro} />
        <OnboardingStack.Screen
          component={CloudBackupScreen}
          name={OnboardingScreens.BackupCloud}
        />
        <OnboardingStack.Screen
          component={CloudBackupProcessingScreen}
          name={OnboardingScreens.BackupCloudProcessing}
        />
        <OnboardingStack.Screen
          component={ImportMethodScreen}
          name={OnboardingScreens.ImportMethod}
        />
        <OnboardingStack.Screen
          component={PrivateKeyInputScreen}
          name={OnboardingScreens.PrivateKeyInput}
        />
        <OnboardingStack.Screen
          component={RestoreWalletScreen}
          name={OnboardingScreens.RestoreWallet}
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
          component={SelectColorScreen}
          name={OnboardingScreens.SelectColor}
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

  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      {finishedOnboarding ? (
        <AppStack.Screen component={TabNavigator} name={Screens.TabNavigator} />
      ) : (
        <AppStack.Screen component={OnboardingStackNavigator} name={Screens.OnboardingStack} />
      )}
      <AppStack.Group screenOptions={navOptions.presentationModal}>
        <AccountStack.Screen component={ImportAccountScreen} name={Screens.ImportAccount} />
        <AccountStack.Screen component={LedgerScreen} name={Screens.Ledger} />
      </AppStack.Group>
      <AppStack.Group>
        <AppStack.Screen component={NFTCollectionScreen} name={Screens.NFTCollection} />
      </AppStack.Group>
      <AppStack.Screen component={WebViewScreen} name={Screens.WebView} />
      <AppStack.Screen component={SettingsStackGroup} name={Screens.SettingsStack} />
      <AppStack.Screen
        component={SettingsWalletManageConnection}
        name={Screens.SettingsWalletManageConnection}
      />
      <AppStack.Group screenOptions={navOptions.presentationModal}>
        <AppStack.Screen component={NotificationsScreen} name={Screens.Notifications} />
        <AppStack.Screen component={CurrencySelectorScreen} name={Screens.CurrencySelector} />
        <AppStack.Screen component={RecipientSelectoScreen} name={Screens.RecipientSelector} />
        <AppStack.Screen component={ProfileStackGroup} name={Screens.ProfileStack} />
        <AppStack.Screen component={TransferTokenScreen} name={Screens.Transfer} />
        <AppStack.Screen component={EducationScreen} name={Screens.Education} />
      </AppStack.Group>
    </AppStack.Navigator>
  )
}

const navOptions = {
  noHeader: { headerShown: false },
  presentationModal: { presentation: 'modal' },
} as const

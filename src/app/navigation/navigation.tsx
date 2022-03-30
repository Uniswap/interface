import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import React from 'react'
import { View } from 'react-native'
import { useAppSelector } from 'src/app/hooks'
import { TabBar } from 'src/app/navigation/TabBar'
import {
  AccountStackParamList,
  AppStackParamList,
  OnboardingStackParamList,
  SettingsStackParamList,
  TabParamList,
} from 'src/app/navigation/types'
import { selectFinishedOnboarding } from 'src/features/user/slice'
import { AccountsScreen } from 'src/screens/AccountsScreen'
import { CurrencySelectorScreen } from 'src/screens/CurrencySelectorScreen'
import { DevScreen } from 'src/screens/DevScreen'
import { ExploreScreen } from 'src/screens/ExploreScreen'
import { HomeScreen } from 'src/screens/HomeScreen'
import { ImportAccountScreen } from 'src/screens/ImportAccountScreen'
import { LedgerScreen } from 'src/screens/LedgerScreen'
import { NFTCollectionScreen } from 'src/screens/NFTCollectionScreen'
import { NFTScreen } from 'src/screens/NFTScreen'
import { NotificationsScreen } from 'src/screens/NotificationsScreen'
import { LandingScreen } from 'src/screens/Onboarding/LandingScreen'
import { OnboardingScreens, Screens, Tabs } from 'src/screens/Screens'
import { SettingsChainsScreen } from 'src/screens/SettingsChainsScreen'
import { SettingsScreen } from 'src/screens/SettingsScreen'
import { SettingsSupportScreen } from 'src/screens/SettingsSupportScreen'
import { SettingsTestConfigs } from 'src/screens/SettingsTestConfigs'
import { SwapScreen } from 'src/screens/SwapScreen'
import { TokenDetailsScreen } from 'src/screens/TokenDetailsScreen'
import { TransferTokenScreen } from 'src/screens/TransferTokenScreen'

const Tab = createBottomTabNavigator<TabParamList>()
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>()
const AppStack = createNativeStackNavigator<AppStackParamList>()
const AccountStack = createNativeStackNavigator<AccountStackParamList>()
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>()

function TabNavigator() {
  return (
    <Tab.Navigator tabBar={(props) => <TabBar {...props} />}>
      <Tab.Screen component={HomeScreen} name={Tabs.Home} options={navOptions.noHeader} />
      <Tab.Screen component={NFTScreen} name={Tabs.NFT} options={navOptions.noHeader} />
      <Tab.Screen component={ExploreScreen} name={Tabs.Explore} options={navOptions.noHeader} />
      <Tab.Screen component={View} name={Tabs.Swap} options={navOptions.noHeader} />
    </Tab.Navigator>
  )
}

function AccountStackGroup() {
  return (
    <AccountStack.Navigator screenOptions={navOptions.noHeader}>
      <AccountStack.Screen component={AccountsScreen} name={Screens.Accounts} />
      <AccountStack.Screen component={ImportAccountScreen} name={Screens.ImportAccount} />
      <AccountStack.Screen component={LedgerScreen} name={Screens.Ledger} />
    </AccountStack.Navigator>
  )
}

function SettingsStackGroup() {
  return (
    <SettingsStack.Navigator screenOptions={navOptions.noHeader}>
      <SettingsStack.Screen component={SettingsScreen} name={Screens.Settings} />
      <SettingsStack.Screen component={SettingsChainsScreen} name={Screens.SettingsChains} />
      <SettingsStack.Screen component={SettingsSupportScreen} name={Screens.SettingsSupport} />
      <SettingsStack.Screen component={SettingsTestConfigs} name={Screens.SettingsTestConfigs} />
      <SettingsStack.Screen component={DevScreen} name={Screens.Dev} />
    </SettingsStack.Navigator>
  )
}

export function AppStackNavigator() {
  const finishedOnboarding = useAppSelector(selectFinishedOnboarding)

  return (
    <AppStack.Navigator screenOptions={navOptions.noHeader}>
      {finishedOnboarding ? (
        <AppStack.Group>
          <OnboardingStack.Screen component={LandingScreen} name={OnboardingScreens.Landing} />
        </AppStack.Group>
      ) : (
        <AppStack.Screen component={TabNavigator} name={Screens.TabNavigator} />
      )}

      <AppStack.Group>
        <AppStack.Screen component={TokenDetailsScreen} name={Screens.TokenDetails} />
        <AppStack.Screen component={NFTCollectionScreen} name={Screens.NFTCollection} />
      </AppStack.Group>
      <AppStack.Group screenOptions={navOptions.presentationModal}>
        <AppStack.Screen component={AccountStackGroup} name={Screens.AccountStack} />
        <AppStack.Screen component={NotificationsScreen} name={Screens.Notifications} />
        <AppStack.Screen component={SwapScreen} name={Screens.Swap} />
        <AppStack.Screen component={CurrencySelectorScreen} name={Screens.CurrencySelector} />
        <AppStack.Screen component={SettingsStackGroup} name={Screens.SettingsStack} />
        <AppStack.Screen component={TransferTokenScreen} name={Screens.Transfer} />
      </AppStack.Group>
    </AppStack.Navigator>
  )
}

const navOptions = {
  noHeader: { headerShown: false },
  presentationModal: { presentation: 'modal' },
} as const

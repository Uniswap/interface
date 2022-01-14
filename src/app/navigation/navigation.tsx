import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { impactAsync } from 'expo-haptics'
import React, { useMemo } from 'react'
import { View } from 'react-native'
import { ExploreTabIcon, SwapButton, WalletTabIcon } from 'src/app/navigation/icons'
import {
  AccountStackParamList,
  AppStackParamList,
  SettingsStackParamList,
  TabParamList,
  useAppStackNavigation,
} from 'src/app/navigation/types'
import { AccountsScreen } from 'src/screens/AccountsScreen'
import { CurrencySelectorScreen } from 'src/screens/CurrencySelectorScreen'
import { DevScreen } from 'src/screens/DevScreen'
import { ExploreScreen } from 'src/screens/ExploreScreen'
import { HomeScreen } from 'src/screens/HomeScreen'
import { ImportAccountScreen } from 'src/screens/ImportAccountScreen'
import { NotificationsScreen } from 'src/screens/NotificationsScreen'
import { Screens, Tabs } from 'src/screens/Screens'
import { SettingsChainsScreen } from 'src/screens/SettingsChainsScreen'
import { SettingsScreen } from 'src/screens/SettingsScreen'
import { SettingsSupportScreen } from 'src/screens/SettingsSupportScreen'
import { SwapScreen } from 'src/screens/SwapScreen'
import { TokenDetailsScreen } from 'src/screens/TokenDetailsScreen'

const Tab = createBottomTabNavigator<TabParamList>()
const AppStack = createNativeStackNavigator<AppStackParamList>()
const AccountStack = createNativeStackNavigator<AccountStackParamList>()
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>()

function TabNavigator() {
  const navigation = useAppStackNavigation()

  const genericTabListeners = useMemo(
    () => ({
      tabPress: () => {
        impactAsync()
      },
    }),
    []
  )

  const swapTabListeners = useMemo(
    () => ({
      tabPress: (e: any) => {
        impactAsync()
        e.preventDefault()
        navigation.navigate(Screens.Swap)
      },
    }),
    [navigation]
  )

  return (
    <BottomSheetModalProvider>
      <Tab.Navigator screenOptions={navOptions.tabBar}>
        <Tab.Screen
          component={HomeScreen}
          listeners={genericTabListeners}
          name={Tabs.Home}
          options={navOptions.tabHome}
        />
        <Tab.Screen
          component={View}
          listeners={swapTabListeners}
          name={Tabs.Swap}
          options={navOptions.tabSwap}
        />
        <Tab.Screen
          component={ExploreScreen}
          listeners={genericTabListeners}
          name={Tabs.Explore}
          options={navOptions.tabExplore}
        />
      </Tab.Navigator>
    </BottomSheetModalProvider>
  )
}

function AccountStackGroup() {
  return (
    <AccountStack.Navigator screenOptions={navOptions.noHeader}>
      <AccountStack.Screen component={AccountsScreen} name={Screens.Accounts} />
      <AccountStack.Screen component={ImportAccountScreen} name={Screens.ImportAccount} />
    </AccountStack.Navigator>
  )
}

function SettingsStackGroup() {
  return (
    <SettingsStack.Navigator screenOptions={navOptions.noHeader}>
      <SettingsStack.Screen component={SettingsScreen} name={Screens.Settings} />
      <SettingsStack.Screen component={SettingsChainsScreen} name={Screens.SettingsChains} />
      <SettingsStack.Screen component={SettingsSupportScreen} name={Screens.SettingsSupport} />
      <SettingsStack.Screen component={DevScreen} name={Screens.Dev} />
    </SettingsStack.Navigator>
  )
}

export function AppStackNavigator() {
  return (
    <AppStack.Navigator screenOptions={navOptions.noHeader}>
      <AppStack.Screen component={TabNavigator} name={Screens.TabNavigator} />
      <AppStack.Group>
        <AppStack.Screen component={TokenDetailsScreen} name={Screens.TokenDetails} />
      </AppStack.Group>
      <AppStack.Group screenOptions={navOptions.presentationModal}>
        <AppStack.Screen component={AccountStackGroup} name={Screens.AccountStack} />
        <AppStack.Screen component={NotificationsScreen} name={Screens.Notifications} />
        <AppStack.Screen component={SwapScreen} name={Screens.Swap} />
        <AppStack.Screen component={CurrencySelectorScreen} name={Screens.CurrencySelector} />
        <AppStack.Screen component={SettingsStackGroup} name={Screens.SettingsStack} />
      </AppStack.Group>
    </AppStack.Navigator>
  )
}

const navOptions = {
  tabBar: {
    tabBarShowLabel: false,
    tabBarStyle: { height: 100, paddingTop: 20 },
  },
  tabHome: { headerShown: false, tabBarIcon: WalletTabIcon },
  tabSwap: {
    tabBarButton: SwapButton,
  },
  tabExplore: {
    headerShown: false,
    tabBarIcon: ExploreTabIcon,
  },
  noHeader: { headerShown: false },
  presentationModal: { presentation: 'modal' },
} as const

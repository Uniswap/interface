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
          name={Tabs.Home}
          component={HomeScreen}
          options={navOptions.tabHome}
          listeners={genericTabListeners}
        />
        <Tab.Screen
          name={Tabs.Swap}
          component={View}
          options={navOptions.tabSwap}
          listeners={swapTabListeners}
        />
        <Tab.Screen
          name={Tabs.Explore}
          component={ExploreScreen}
          options={navOptions.tabExplore}
          listeners={genericTabListeners}
        />
      </Tab.Navigator>
    </BottomSheetModalProvider>
  )
}

function AccountStackGroup() {
  return (
    <AccountStack.Navigator screenOptions={navOptions.noHeader}>
      <AccountStack.Screen name={Screens.Accounts} component={AccountsScreen} />
      <AccountStack.Screen name={Screens.ImportAccount} component={ImportAccountScreen} />
    </AccountStack.Navigator>
  )
}

function SettingsStackGroup() {
  return (
    <SettingsStack.Navigator screenOptions={navOptions.noHeader}>
      <SettingsStack.Screen name={Screens.Settings} component={SettingsScreen} />
      <SettingsStack.Screen name={Screens.SettingsChains} component={SettingsChainsScreen} />
      <SettingsStack.Screen name={Screens.SettingsSupport} component={SettingsSupportScreen} />
      <SettingsStack.Screen name={Screens.Dev} component={DevScreen} />
    </SettingsStack.Navigator>
  )
}

export function AppStackNavigator() {
  return (
    <AppStack.Navigator screenOptions={navOptions.noHeader}>
      <AppStack.Screen name={Screens.TabNavigator} component={TabNavigator} />
      <AppStack.Group>
        <AppStack.Screen name={Screens.TokenDetails} component={TokenDetailsScreen} />
      </AppStack.Group>
      <AppStack.Group screenOptions={navOptions.presentationModal}>
        <AppStack.Screen name={Screens.AccountStack} component={AccountStackGroup} />
        <AppStack.Screen name={Screens.Notifications} component={NotificationsScreen} />
        <AppStack.Screen name={Screens.Swap} component={SwapScreen} />
        <AppStack.Screen name={Screens.CurrencySelector} component={CurrencySelectorScreen} />
        <AppStack.Screen name={Screens.SettingsStack} component={SettingsStackGroup} />
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

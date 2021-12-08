import { BottomTabBarButtonProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useTheme } from '@shopify/restyle'
import React from 'react'
import { View } from 'react-native'
import {
  AccountStackParamList,
  AppStackParamList,
  DevStackParamList,
  TabParamList,
  useAppStackNavigation,
} from 'src/app/navigation/types'
import SearchIcon from 'src/assets/icons/search.svg'
import SwapIcon from 'src/assets/icons/swap.svg'
import WalletIcon from 'src/assets/icons/wallet.svg'
import { IconButton } from 'src/components/buttons/IconButton'
import { AccountsScreen } from 'src/screens/AccountsScreen'
import { CurrencySelectorScreen } from 'src/screens/CurrencySelectorScreen'
import { DevScreen } from 'src/screens/DevScreen'
import { ExploreScreen } from 'src/screens/ExploreScreen'
import { HomeScreen } from 'src/screens/HomeScreen'
import { ImportAccountScreen } from 'src/screens/ImportAccountScreen'
import { NotificationsScreen } from 'src/screens/NotificationsScreen'
import { Screens, Tabs } from 'src/screens/Screens'
import { SwapScreen } from 'src/screens/SwapScreen'
import { TokenDetailsScreen } from 'src/screens/TokenDetailsScreen'
import { Theme } from 'src/styles/theme'

const Tab = createBottomTabNavigator<TabParamList>()
const AppStack = createNativeStackNavigator<AppStackParamList>()
const DevStack = createNativeStackNavigator<DevStackParamList>()
const AccountStack = createNativeStackNavigator<AccountStackParamList>()

function SwapButton(props: BottomTabBarButtonProps) {
  return (
    <IconButton
      mb="sm"
      variant={'primary'}
      onPress={props.onPress}
      icon={<SwapIcon height={24} width={24} fill={'white'} />}
    />
  )
}

function TabNavigator() {
  const navigation = useAppStackNavigation()
  const theme = useTheme<Theme>()
  const primaryColor = theme.colors.primary1
  const secondaryColor = theme.colors.black

  function WalletTabIcon({ focused }: { focused: boolean }) {
    return <WalletIcon height={30} width={30} fill={focused ? primaryColor : secondaryColor} />
  }

  function ExploreTabIcon({ focused }: { focused: boolean }) {
    return <SearchIcon height={25} width={34} stroke={focused ? primaryColor : secondaryColor} />
  }

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: { height: 102, paddingTop: 20 },
      }}>
      <Tab.Screen
        name={Tabs.Home}
        component={HomeScreen}
        options={{ headerShown: false, tabBarIcon: WalletTabIcon }}
      />
      <Tab.Screen
        name={Tabs.Swap}
        component={View}
        options={{
          tabBarButton: SwapButton,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault()
            navigation.navigate(Screens.Swap)
          },
        }}
      />
      <Tab.Screen
        name={Tabs.Explore}
        component={ExploreScreen}
        options={{ headerShown: false, tabBarIcon: ExploreTabIcon }}
      />
    </Tab.Navigator>
  )
}

function AccountStackGroup() {
  return (
    <AccountStack.Navigator screenOptions={{ headerShown: false }}>
      <AccountStack.Screen name={Screens.Accounts} component={AccountsScreen} />
      <AccountStack.Screen
        name={Screens.ImportAccount}
        component={ImportAccountScreen}
        options={{ title: 'Uniswap | Import' }}
      />
    </AccountStack.Navigator>
  )
}

function DevStackGroup() {
  return (
    <DevStack.Navigator screenOptions={{ headerShown: false }}>
      <DevStack.Screen name={Screens.Dev} component={DevScreen} />
    </DevStack.Navigator>
  )
}

export function AppStackNavigator() {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen name={Screens.TabNavigator} component={TabNavigator} />
      <AppStack.Group>
        <AppStack.Screen name={Screens.TokenDetails} component={TokenDetailsScreen} />
      </AppStack.Group>
      <AppStack.Group screenOptions={{ presentation: 'modal' }}>
        <AppStack.Screen name={Screens.Notifications} component={NotificationsScreen} />
        <AppStack.Screen name={Screens.AccountStack} component={AccountStackGroup} />
        <AppStack.Screen name={Screens.Swap} component={SwapScreen} />
        <AppStack.Screen
          name={Screens.CurrencySelector}
          component={CurrencySelectorScreen}
          options={{ title: 'Select Currency' }}
        />
        <AppStack.Screen name={Screens.DevStack} component={DevStackGroup} />
      </AppStack.Group>
    </AppStack.Navigator>
  )
}

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import React from 'react'
import {
  DevStackParamList,
  HomeStackParamList,
  RootTabParamList,
  SwapStackParamList,
} from 'src/app/navigation/types'
import CoffeeIcon from 'src/assets/icons/coffee.svg'
import SwapIcon from 'src/assets/icons/swap.svg'
import WalletIcon from 'src/assets/icons/wallet.svg'
import { config } from 'src/config'
import { AccountsScreen } from 'src/screens/AccountsScreen'
import { BalancesScreen } from 'src/screens/BalancesScreen'
import { CameraScreen } from 'src/screens/CameraScreen'
import { DevScreen } from 'src/screens/DevScreen'
import { HomeScreen } from 'src/screens/HomeScreen'
import { ImportAccountScreen } from 'src/screens/ImportAccountScreen'
import { NotificationsScreen } from 'src/screens/NotificationsScreen'
import { Screens, Tabs } from 'src/screens/Screens'
import { SeedPhraseScreen } from 'src/screens/SeedPhraseScreen'
import { SwapConfigScreen } from 'src/screens/SwapConfigScreen'
import { SwapScreen } from 'src/screens/SwapScreen'
import { TokenDetailsScreen } from 'src/screens/TokenDetailsScreen'
import { TransferTokenScreen } from 'src/screens/TransferTokenScreen'
import { WelcomeScreen } from 'src/screens/WelcomeScreen'

const Tab = createBottomTabNavigator<RootTabParamList>()

const HomeStack = createNativeStackNavigator<HomeStackParamList>()
const SwapStack = createNativeStackNavigator<SwapStackParamList>()
const DevStack = createNativeStackNavigator<DevStackParamList>()

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          if (route.name === Tabs.Home) {
            return <WalletIcon height={30} width={30} fill={focused ? 'blue' : 'black'} />
          } else if (route.name === Tabs.Swap) {
            return <SwapIcon height={30} width={30} fill={focused ? 'blue' : 'black'} />
          } else if (route.name === Tabs.Dev) {
            return <CoffeeIcon height={30} width={30} stroke={focused ? 'blue' : 'black'} />
          }
        },
        tabBarShowLabel: false,
      })}>
      <Tab.Screen name={Tabs.Home} component={HomeStackScreen} options={{ headerShown: false }} />
      <Tab.Screen name={Tabs.Swap} component={SwapStackScreen} options={{ headerShown: false }} />
      {config.debug && (
        <Tab.Screen name={Tabs.Dev} component={DevStackScreen} options={{ headerShown: false }} />
      )}
    </Tab.Navigator>
  )
}

function HomeStackScreen() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name={Screens.Home}
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name={Screens.TokenDetails}
        component={TokenDetailsScreen}
        options={{ headerShown: false }}
      />
      {/* TODO: reorganize account screens */}
      <HomeStack.Screen
        name={Screens.Accounts}
        component={AccountsScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name={Screens.ImportAccount}
        component={ImportAccountScreen}
        options={{ title: 'Uniswap | Import' }}
      />
      <HomeStack.Screen
        name={Screens.Notifications}
        component={NotificationsScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name={Screens.Camera}
        component={CameraScreen}
        options={{ title: 'Uniswap | Camera' }}
      />
      <HomeStack.Screen
        name={Screens.SeedPhrase}
        component={SeedPhraseScreen}
        options={{ title: 'Uniswap | Seed Phrase' }}
      />
      {/* TODO: Welcome still needed? */}
      <HomeStack.Screen
        name={Screens.Welcome}
        component={WelcomeScreen}
        options={{ title: 'Uniswap | Welcome' }}
      />
    </HomeStack.Navigator>
  )
}

function SwapStackScreen() {
  return (
    <SwapStack.Navigator>
      <SwapStack.Screen
        name={Screens.Swap}
        component={SwapScreen}
        options={{ headerShown: false }}
      />
      <SwapStack.Screen
        name={Screens.SwapConfig}
        component={SwapConfigScreen}
        options={{ headerShown: false }}
      />
      <SwapStack.Screen
        name={Screens.Transfer}
        component={TransferTokenScreen}
        options={{ title: 'Uniswap | Send' }}
      />
    </SwapStack.Navigator>
  )
}

function DevStackScreen() {
  return (
    <DevStack.Navigator>
      <DevStack.Screen name={Screens.Dev} component={DevScreen} />
      <DevStack.Screen name={Screens.Balances} component={BalancesScreen} />
    </DevStack.Navigator>
  )
}

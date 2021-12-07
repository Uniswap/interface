import { BottomTabBarButtonProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useTheme } from '@shopify/restyle'
import React from 'react'
import { View } from 'react-native'
import {
  ExploreStackParamList,
  HomeStackParamList,
  RootTabParamList,
  SwapStackParamList,
  useAppNavigation,
} from 'src/app/navigation/types'
import SearchIcon from 'src/assets/icons/search.svg'
import SwapIcon from 'src/assets/icons/swap.svg'
import WalletIcon from 'src/assets/icons/wallet.svg'
import { IconButton } from 'src/components/buttons/IconButton'
import { AccountsScreen } from 'src/screens/AccountsScreen'
import { CameraScreen } from 'src/screens/CameraScreen'
import { CurrencySelectorScreen } from 'src/screens/CurrencySelectorScreen'
import { DevScreen } from 'src/screens/DevScreen'
import { ExploreScreen } from 'src/screens/ExploreScreen'
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
import { Theme } from 'src/styles/theme'

const Tab = createBottomTabNavigator<RootTabParamList>()

const HomeStack = createNativeStackNavigator<HomeStackParamList>()
const SwapStack = createNativeStackNavigator<SwapStackParamList>()
const ExploreStack = createNativeStackNavigator<ExploreStackParamList>()

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
  const navigation = useAppNavigation()
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
        component={HomeStackScreen}
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
        component={ExploreScreenStack}
        options={{ headerShown: false, tabBarIcon: ExploreTabIcon }}
      />
    </Tab.Navigator>
  )
}

function HomeStackScreen() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Group>
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
      </HomeStack.Group>
      <HomeStack.Group screenOptions={{ headerShown: false }}>
        {/* TODO: reorganize account screens */}
        <HomeStack.Screen name={Screens.Accounts} component={AccountsScreen} />
        <HomeStack.Screen
          name={Screens.ImportAccount}
          component={ImportAccountScreen}
          options={{ title: 'Uniswap | Import' }}
        />
        <HomeStack.Screen name={Screens.Notifications} component={NotificationsScreen} />
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
        <HomeStack.Screen
          name={Screens.Dev}
          component={DevScreen}
          options={{ headerShown: true }}
        />
      </HomeStack.Group>
    </HomeStack.Navigator>
  )
}

export function SwapStackNavigator() {
  return (
    <SwapStack.Navigator>
      <SwapStack.Screen
        name={Screens.TabNavigator}
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <SwapStack.Screen
        name={Screens.Swap}
        component={SwapScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
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
      <SwapStack.Screen
        name={Screens.CurrencySelector}
        component={CurrencySelectorScreen}
        options={{ title: 'Select Currency', presentation: 'modal' }}
      />
    </SwapStack.Navigator>
  )
}

function ExploreScreenStack() {
  return (
    <ExploreStack.Navigator>
      <ExploreStack.Group>
        <ExploreStack.Screen
          name={Screens.Explore}
          component={ExploreScreen}
          options={{ headerShown: false }}
        />
        <ExploreStack.Screen
          name={Screens.TokenDetails}
          component={TokenDetailsScreen}
          options={{ headerShown: false }}
        />
      </ExploreStack.Group>
    </ExploreStack.Navigator>
  )
}

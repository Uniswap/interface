import { CompositeNavigationProp, useNavigation } from '@react-navigation/core'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Currency } from '@uniswap/sdk-core'
import { ChainId } from 'src/constants/chains'
import { Screens, Tabs } from 'src/screens/Screens'

export type RootTabParamList = {
  [Tabs.Dev]: undefined
  [Tabs.Home]: undefined
  [Tabs.Swap]: undefined
  [Tabs.Explore]: undefined
}

export type DevStackParamList = {
  [Screens.Dev]: undefined
  [Screens.Balances]: undefined
}

export type ExploreStackParamList = {
  [Screens.Explore]: undefined
  [Screens.TokenDetails]: { currency: Currency }
}

export type HomeStackParamList = {
  [Screens.Home]: undefined
  [Screens.Accounts]: undefined
  [Screens.Balances]: undefined
  [Screens.Camera]: undefined
  [Screens.ImportAccount]: undefined
  [Screens.Notifications]: undefined
  [Screens.SeedPhrase]: { seedPhrase: string[] }
  [Screens.TokenDetails]: { currency: Currency }
  [Screens.Welcome]: undefined
  [Screens.Dev]: undefined
}

export type SwapStackParamList = {
  [Screens.CurrencySelector]: {
    onSelectCurrency: (currency: Currency) => void
    preselectedCurrencyAddress?: string
    preselectedCurrencyChainId?: ChainId
  }
  [Screens.Swap]: undefined
  [Screens.SwapConfig]: undefined
  [Screens.TabNavigator]: undefined
  [Screens.Transfer]: undefined
}

export type DevNavigationProps = NativeStackNavigationProp<DevStackParamList>
export type HomeNavigationProps = NativeStackNavigationProp<HomeStackParamList>
export type SwapNavigationProps = NativeStackNavigationProp<SwapStackParamList>

type NavigationProps = CompositeNavigationProp<
  HomeNavigationProps,
  CompositeNavigationProp<SwapNavigationProps, DevNavigationProps>
>
export const useAppNavigation = () => useNavigation<NavigationProps>()

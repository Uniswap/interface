import { BottomTabNavigationProp, BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import {
  CompositeNavigationProp,
  CompositeScreenProps,
  NavigatorScreenParams,
  useNavigation,
} from '@react-navigation/native'
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'
import { Currency } from '@uniswap/sdk-core'
import { ChainId } from 'src/constants/chains'
import { SwapFormState } from 'src/features/swap/swapFormSlice'
import { Screens, Tabs } from 'src/screens/Screens'

export type TabParamList = {
  [Tabs.Home]: undefined
  [Tabs.Swap]: { swapFormState?: SwapFormState } | undefined
  [Tabs.Explore]: undefined
}

export type DevStackParamList = {
  [Screens.Dev]: undefined
  [Screens.Balances]: undefined
}

export type AccountStackParamList = {
  [Screens.Accounts]: undefined
  [Screens.ImportAccount]: undefined
}

export type AppStackParamList = {
  [Screens.AccountStack]: NavigatorScreenParams<AccountStackParamList>
  [Screens.CurrencySelector]: {
    showNonZeroBalancesOnly: boolean
    onSelectCurrency: (currency: Currency) => void
    otherCurrencyAddress?: string
    otherCurrencyChainId?: ChainId
    selectedCurrencyAddress?: string
    selectedCurrencyChainId?: ChainId
  }
  [Screens.DevStack]: NavigatorScreenParams<DevStackParamList>
  [Screens.Notifications]: undefined
  [Screens.Swap]: { swapFormState?: SwapFormState } | undefined
  [Screens.SwapConfig]: undefined
  [Screens.TabNavigator]: NavigatorScreenParams<TabParamList>
  [Screens.Transfer]: undefined
  [Screens.TokenDetails]: { currency: Currency }
}

export type AppStackNavigationProp = NativeStackNavigationProp<AppStackParamList>
export type AppStackScreenProps = NativeStackScreenProps<AppStackParamList>
export type AppStackScreenProp<Screen extends keyof AppStackParamList> = NativeStackScreenProps<
  AppStackParamList,
  Screen
>

export type TabNavigationProp<Screen extends keyof TabParamList> = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, Screen>,
  AppStackNavigationProp
>
export type TabScreenProp<Screen extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, Screen>,
  AppStackScreenProps
>

export type AccountStackNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<AccountStackParamList>,
  AppStackNavigationProp
>

export type AccountStackScreenProp<Screen extends keyof AccountStackParamList> =
  CompositeScreenProps<NativeStackScreenProps<AccountStackParamList, Screen>, AppStackScreenProps>

export type DevStackNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<DevStackParamList>,
  AppStackNavigationProp
>

export const useAppStackNavigation = () => useNavigation<AppStackNavigationProp>()
export const useAccountStackNavigation = () => useNavigation<AccountStackNavigationProp>()

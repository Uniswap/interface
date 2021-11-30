import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Screens, Tabs } from 'src/screens/Screens'

export type RootTabParamList = {
  [Tabs.Dev]: undefined
  [Tabs.Home]: undefined
  [Tabs.Swap]: undefined
}

export type DevStackParamList = {
  [Screens.Dev]: undefined
  [Screens.Balances]: undefined
}

export type HomeStackParamList = {
  [Screens.Home]: undefined
  [Screens.Accounts]: undefined
  [Screens.Balances]: undefined
  [Screens.Camera]: undefined
  [Screens.ImportAccount]: undefined
  [Screens.Notifications]: undefined
  [Screens.SeedPhrase]: { seedPhrase: string[] }
  [Screens.TokenDetails]: { currencyAmount: CurrencyAmount<Currency> }
  [Screens.Welcome]: undefined
}

export type SwapStackParamList = {
  [Screens.Swap]: undefined
  [Screens.SwapConfig]: undefined
  [Screens.Transfer]: undefined
}

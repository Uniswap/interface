import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Screens } from 'src/app/Screens'

// Route nav props go here
export type RootStackParamList = {
  [Screens.Accounts]: undefined
  [Screens.Balances]: undefined
  [Screens.Camera]: undefined
  [Screens.Dev]: undefined
  [Screens.Home]: undefined
  [Screens.ImportAccount]: undefined
  [Screens.SeedPhrase]: { seedPhrase: string[] }
  [Screens.Swap]: undefined
  [Screens.SwapConfig]: undefined
  [Screens.TokenDetails]: { currencyAmount: CurrencyAmount<Currency> }
  [Screens.Transfer]: undefined
  [Screens.Welcome]: undefined
}

import { Screens } from 'src/app/Screens'
import { ChainId } from 'src/constants/chains'

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
  [Screens.TokenDetails]: { tokenAddress: Address; chainId: ChainId }
  [Screens.Transfer]: undefined
  [Screens.Welcome]: undefined
}

import { Screens } from 'src/app/Screens'
import { ChainId } from 'src/constants/chains'

// Route nav props go here
export type RootStackParamList = {
  [Screens.Balances]: undefined
  [Screens.Camera]: undefined
  [Screens.Home]: undefined
  [Screens.ImportAccount]: undefined
  [Screens.SeedPhrase]: { seedPhrase: string[] }
  [Screens.TokenDetails]: { tokenAddress: Address; chainId: ChainId }
  [Screens.Transfer]: undefined
  [Screens.Welcome]: undefined
}

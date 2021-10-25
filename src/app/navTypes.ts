import { Screens } from 'src/app/Screens'
import { SupportedChainId } from 'src/constants/chains'

// Route nav props go here
export type RootStackParamList = {
  [Screens.Balances]: undefined
  [Screens.Camera]: undefined
  [Screens.Home]: undefined
  [Screens.ImportAccount]: undefined
  [Screens.SeedPhrase]: { seedPhrase: string[] }
  [Screens.TokenDetails]: { tokenAddress: Address; chainId: SupportedChainId }
  [Screens.Transfer]: undefined
  [Screens.Welcome]: undefined
}

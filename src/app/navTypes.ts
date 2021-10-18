// Route nav props go here

import { Screens } from 'src/app/Screens'

export type RootStackParamList = {
  [Screens.Camera]: undefined
  [Screens.Home]: undefined
  [Screens.ImportAccount]: undefined
  [Screens.SeedPhrase]: { seedPhrase: string[] }
  [Screens.Transfer]: undefined
  [Screens.Welcome]: undefined
}

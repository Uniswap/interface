import { MobileScreens } from 'uniswap/src/types/screens/mobile'

export interface UnitagsIntroModalState {
  address: Address
  entryPoint: MobileScreens.Home | MobileScreens.Settings
}

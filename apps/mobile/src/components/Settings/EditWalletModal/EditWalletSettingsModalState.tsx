import { MobileScreens, UnitagScreens } from 'uniswap/src/types/screens/mobile'

export interface EditWalletSettingsModalState {
  address: Address
  accessPoint?: UnitagScreens.UnitagConfirmation | MobileScreens.SettingsWallet
}

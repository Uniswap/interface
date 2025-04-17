import { Dispatch } from 'redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { openModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { MobileScreens, UnitagScreens } from 'uniswap/src/types/screens/mobile'

export const navigateBackFromEditingWallet = (
  dispatch: Dispatch,
  entryPoint: UnitagScreens.UnitagConfirmation | MobileScreens.SettingsWallet,
  address: string,
): void => {
  if (entryPoint === UnitagScreens.UnitagConfirmation) {
    navigate(ModalName.AccountSwitcher)
  } else {
    dispatch(
      openModal({
        name: ModalName.ManageWalletsModal,
        initialState: { address },
      }),
    )
  }
}

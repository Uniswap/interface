import { AppStackScreenProp } from 'src/app/navigation/types'
import { ReactNavigationModal } from 'src/components/modals/ReactNavigationModals/ReactNavigationModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { SmartWalletConfirmModal } from 'wallet/src/features/smartWallet/modals/SmartWalletConfirmModal'

export const SmartWalletConfirmModalScreen = (
  props: AppStackScreenProp<typeof ModalName.SmartWalletConfirmModal>,
): JSX.Element => {
  return <ReactNavigationModal {...props} modalComponent={SmartWalletConfirmModal} />
}

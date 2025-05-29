import { AppStackScreenProp } from 'src/app/navigation/types'
import { ReactNavigationModal } from 'src/components/modals/ReactNavigationModals/ReactNavigationModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { SmartWalletCreatedModal } from 'wallet/src/components/smartWallet/modals/SmartWalletCreatedModal'

export const SmartWalletCreatedModalScreen = (
  props: AppStackScreenProp<typeof ModalName.SmartWalletCreatedModal>,
): JSX.Element => {
  return <ReactNavigationModal {...props} modalComponent={SmartWalletCreatedModal} />
}

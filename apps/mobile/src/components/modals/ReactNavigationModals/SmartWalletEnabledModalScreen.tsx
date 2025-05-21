import { AppStackScreenProp } from 'src/app/navigation/types'
import { ReactNavigationModal } from 'src/components/modals/ReactNavigationModals/ReactNavigationModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { SmartWalletEnabledModal } from 'wallet/src/components/smartWallet/modals/SmartWalletEnabledModal'

export const SmartWalletEnabledModalScreen = (
  props: AppStackScreenProp<typeof ModalName.SmartWalletEnabledModal>,
): JSX.Element => {
  return <ReactNavigationModal {...props} modalComponent={SmartWalletEnabledModal} />
}

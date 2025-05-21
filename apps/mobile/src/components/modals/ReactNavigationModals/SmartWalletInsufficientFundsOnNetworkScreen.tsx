import { AppStackScreenProp } from 'src/app/navigation/types'
import { ReactNavigationModal } from 'src/components/modals/ReactNavigationModals/ReactNavigationModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { SmartWalletInsufficientFundsOnNetworkModal } from 'wallet/src/features/smartWallet/modals/SmartWalletInsufficientFundsOnNetworkModal'

export const SmartWalletInsufficientFundsOnNetworkScreen = (
  props: AppStackScreenProp<typeof ModalName.SmartWalletInsufficientFundsOnNetworkModal>,
): JSX.Element => {
  return <ReactNavigationModal {...props} modalComponent={SmartWalletInsufficientFundsOnNetworkModal} />
}

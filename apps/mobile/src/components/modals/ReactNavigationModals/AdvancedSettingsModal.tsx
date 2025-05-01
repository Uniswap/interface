import { AppStackScreenProp } from 'src/app/navigation/types'
import { ReactNavigationModal } from 'src/components/modals/ReactNavigationModals/ReactNavigationModal'
import { SmartWalletAdvancedSettingsModal } from 'uniswap/src/features/smartWallet/modals/SmartWalletAdvancedSettingsModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export const AdvancedSettingsModal = (
  props: AppStackScreenProp<typeof ModalName.SmartWalletAdvancedSettingsModal>,
): JSX.Element => {
  return <ReactNavigationModal {...props} modalComponent={SmartWalletAdvancedSettingsModal} />
}

import { PasskeyManagementModal } from '@universe/embedded-wallet'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { ReactNavigationModal } from 'src/components/modals/ReactNavigationModals/ReactNavigationModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export const PasskeyManagementModalScreen = (
  props: AppStackScreenProp<typeof ModalName.PasskeyManagement>,
): JSX.Element => {
  return <ReactNavigationModal {...props} modalComponent={PasskeyManagementModal} />
}

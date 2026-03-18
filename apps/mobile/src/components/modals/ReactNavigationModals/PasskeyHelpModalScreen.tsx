import { AppStackScreenProp } from 'src/app/navigation/types'
import { ReactNavigationModal } from 'src/components/modals/ReactNavigationModals/ReactNavigationModal'
import { PasskeysHelpModal } from 'uniswap/src/features/passkey/PasskeysHelpModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export const PasskeyHelpModalScreen = (props: AppStackScreenProp<typeof ModalName.PasskeysHelp>): JSX.Element => {
  return <ReactNavigationModal {...props} modalComponent={PasskeysHelpModal} />
}

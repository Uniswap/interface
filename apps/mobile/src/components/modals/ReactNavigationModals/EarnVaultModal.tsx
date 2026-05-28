import { AppStackScreenProp } from 'src/app/navigation/types'
import { EarnVaultModal } from 'src/components/earn/EarnVaultModal'
import { ReactNavigationModal } from 'src/components/modals/ReactNavigationModals/ReactNavigationModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export const EarnVaultModalScreen = (props: AppStackScreenProp<typeof ModalName.EarnVault>): JSX.Element => {
  return <ReactNavigationModal {...props} modalComponent={EarnVaultModal} />
}

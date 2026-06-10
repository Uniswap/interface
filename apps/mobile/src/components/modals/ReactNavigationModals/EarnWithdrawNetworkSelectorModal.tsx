import { AppStackScreenProp } from 'src/app/navigation/types'
import { EarnWithdrawNetworkSelectorModal } from 'src/components/earn/EarnWithdrawNetworkSelectorModal'
import { ReactNavigationModal } from 'src/components/modals/ReactNavigationModals/ReactNavigationModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export const EarnWithdrawNetworkSelectorModalScreen = (
  props: AppStackScreenProp<typeof ModalName.EarnWithdrawNetworkSelector>,
): JSX.Element => {
  return <ReactNavigationModal {...props} modalComponent={EarnWithdrawNetworkSelectorModal} />
}

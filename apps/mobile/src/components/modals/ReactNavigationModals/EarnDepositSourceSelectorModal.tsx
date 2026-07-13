import { AppStackScreenProp } from 'src/app/navigation/types'
import { EarnDepositSourceSelectorModal } from 'src/components/earn/EarnDepositSourceSelectorModal'
import { ReactNavigationModal } from 'src/components/modals/ReactNavigationModals/ReactNavigationModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export const EarnDepositSourceSelectorModalScreen = (
  props: AppStackScreenProp<typeof ModalName.EarnDepositSourceSelector>,
): JSX.Element => {
  return <ReactNavigationModal {...props} modalComponent={EarnDepositSourceSelectorModal} />
}

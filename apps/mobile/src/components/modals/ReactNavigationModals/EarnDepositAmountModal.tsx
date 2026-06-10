import { AppStackScreenProp } from 'src/app/navigation/types'
import { EarnDepositAmountModal } from 'src/components/earn/EarnDepositAmountModal'
import { ReactNavigationModal } from 'src/components/modals/ReactNavigationModals/ReactNavigationModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export const EarnDepositAmountModalScreen = (
  props: AppStackScreenProp<typeof ModalName.EarnDepositAmount>,
): JSX.Element => {
  return <ReactNavigationModal {...props} modalComponent={EarnDepositAmountModal} />
}

import { AppStackScreenProp } from 'src/app/navigation/types'
import { EarnDepositReviewModal } from 'src/components/earn/EarnDepositReviewModal'
import { ReactNavigationModal } from 'src/components/modals/ReactNavigationModals/ReactNavigationModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export const EarnDepositReviewModalScreen = (
  props: AppStackScreenProp<typeof ModalName.EarnDepositReview>,
): JSX.Element => {
  return <ReactNavigationModal {...props} modalComponent={EarnDepositReviewModal} />
}

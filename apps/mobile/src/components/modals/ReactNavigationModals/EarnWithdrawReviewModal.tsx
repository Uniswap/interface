import { AppStackScreenProp } from 'src/app/navigation/types'
import { EarnWithdrawReviewModal } from 'src/components/earn/EarnWithdrawReviewModal'
import { ReactNavigationModal } from 'src/components/modals/ReactNavigationModals/ReactNavigationModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export const EarnWithdrawReviewModalScreen = (
  props: AppStackScreenProp<typeof ModalName.EarnWithdrawReview>,
): JSX.Element => {
  return <ReactNavigationModal {...props} modalComponent={EarnWithdrawReviewModal} />
}

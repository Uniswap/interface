import { AppStackScreenProp } from 'src/app/navigation/types'
import { EarnYouNeedTokenModal } from 'src/components/earn/EarnYouNeedTokenModal'
import { ReactNavigationModal } from 'src/components/modals/ReactNavigationModals/ReactNavigationModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export const EarnYouNeedTokenModalScreen = (
  props: AppStackScreenProp<typeof ModalName.EarnYouNeedToken>,
): JSX.Element => {
  return <ReactNavigationModal {...props} modalComponent={EarnYouNeedTokenModal} />
}

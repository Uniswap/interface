import type { AppStackScreenProp } from 'src/app/navigation/types'
import { EarnHowItWorksModal } from 'src/components/earn/EarnHowItWorksModal'
import { ReactNavigationModal } from 'src/components/modals/ReactNavigationModals/ReactNavigationModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export const EarnHowItWorksModalScreen = (props: AppStackScreenProp<typeof ModalName.EarnHowItWorks>): JSX.Element => {
  return <ReactNavigationModal {...props} modalComponent={EarnHowItWorksModal} />
}

import { AppStackScreenProp } from 'src/app/navigation/types'
import { ReactNavigationModal } from 'src/components/modals/ReactNavigationModals/ReactNavigationModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { AboutModal } from 'wallet/src/components/settings/about/AboutModal'

export const AboutSettingsScreen = (props: AppStackScreenProp<typeof ModalName.About>): JSX.Element => {
  return <ReactNavigationModal {...props} modalComponent={AboutModal} />
}

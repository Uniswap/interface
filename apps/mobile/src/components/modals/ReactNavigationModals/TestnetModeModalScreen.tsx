import { AppStackScreenProp } from 'src/app/navigation/types'
import { ReactNavigationModal } from 'src/components/modals/ReactNavigationModals/ReactNavigationModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestnetModeModal } from 'uniswap/src/features/testnets/TestnetModeModal'

export const TestnetModeModalScreen = (props: AppStackScreenProp<typeof ModalName.TestnetMode>): JSX.Element => {
  return <ReactNavigationModal {...props} modalComponent={TestnetModeModal} />
}

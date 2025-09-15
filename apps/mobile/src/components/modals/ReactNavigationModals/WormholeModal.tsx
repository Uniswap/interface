import { AppStackScreenProp } from 'src/app/navigation/types'
import { ReactNavigationModal } from 'src/components/modals/ReactNavigationModals/ReactNavigationModal'
import { WormholeModal } from 'uniswap/src/components/BridgedAsset/WormholeModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export const WormholeModalScreen = (props: AppStackScreenProp<typeof ModalName.Wormhole>): JSX.Element => {
  return <ReactNavigationModal {...props} modalComponent={WormholeModal} />
}

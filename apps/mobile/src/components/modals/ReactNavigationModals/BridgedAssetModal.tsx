import { AppStackScreenProp } from 'src/app/navigation/types'
import { ReactNavigationModal } from 'src/components/modals/ReactNavigationModals/ReactNavigationModal'
import { BridgedAssetModal } from 'uniswap/src/components/BridgedAsset/BridgedAssetModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export const BridgedAssetModalScreen = (props: AppStackScreenProp<typeof ModalName.BridgedAsset>): JSX.Element => {
  return <ReactNavigationModal {...props} modalComponent={BridgedAssetModal} />
}

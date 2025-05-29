import { AppStackScreenProp } from 'src/app/navigation/types'
import { ReactNavigationModal } from 'src/components/modals/ReactNavigationModals/ReactNavigationModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { PostSwapSmartWalletNudge } from 'wallet/src/components/smartWallet/modals/PostSwapSmartWalletNudge'

export const PostSwapSmartWalletNudgeScreen = (
  props: AppStackScreenProp<typeof ModalName.PostSwapSmartWalletNudge>,
): JSX.Element => {
  return <ReactNavigationModal {...props} modalComponent={PostSwapSmartWalletNudge} />
}

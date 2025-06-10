import { useMemo } from 'react'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { ReactNavigationModal } from 'src/components/modals/ReactNavigationModals/ReactNavigationModal'
import { useOnEnableSmartWallet } from 'src/features/smartWallet/hooks/useOnEnableSmartWallet'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import {
  PostSwapSmartWalletNudge,
  PostSwapSmartWalletNudgeProps,
} from 'wallet/src/components/smartWallet/modals/PostSwapSmartWalletNudge'

export const PostSwapSmartWalletNudgeScreen = (
  props: AppStackScreenProp<typeof ModalName.PostSwapSmartWalletNudge>,
): JSX.Element => {
  const onEnableSmartWallet = useOnEnableSmartWallet()

  const modalComponent = useMemo(() => {
    // Create a wrapper component that pre-fills the onEnableSmartWallet prop if it's not defined
    return function PostSwapSmartWalletNudgeWrapper(modalProps: PostSwapSmartWalletNudgeProps) {
      if (modalProps.onEnableSmartWallet) {
        return <PostSwapSmartWalletNudge {...modalProps} />
      }
      return <PostSwapSmartWalletNudge {...modalProps} onEnableSmartWallet={onEnableSmartWallet} />
    }
  }, [onEnableSmartWallet])

  return <ReactNavigationModal {...props} modalComponent={modalComponent} />
}

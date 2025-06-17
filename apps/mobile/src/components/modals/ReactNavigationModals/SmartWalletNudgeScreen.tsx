import { useMemo } from 'react'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { ReactNavigationModal } from 'src/components/modals/ReactNavigationModals/ReactNavigationModal'
import { useOnEnableSmartWallet } from 'src/features/smartWallet/hooks/useOnEnableSmartWallet'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { SmartWalletNudge, SmartWalletNudgeProps } from 'wallet/src/components/smartWallet/modals/SmartWalletNudge'

export const SmartWalletNudgeScreen = (props: AppStackScreenProp<typeof ModalName.SmartWalletNudge>): JSX.Element => {
  const onEnableSmartWallet = useOnEnableSmartWallet()

  const modalComponent = useMemo(() => {
    // Create a wrapper component that pre-fills the onEnableSmartWallet prop if it's not defined
    return function SmartWalletNudgeWrapper(modalProps: SmartWalletNudgeProps) {
      if (modalProps.onEnableSmartWallet) {
        return <SmartWalletNudge {...modalProps} />
      }
      return <SmartWalletNudge {...modalProps} onEnableSmartWallet={onEnableSmartWallet} />
    }
  }, [onEnableSmartWallet])

  return <ReactNavigationModal {...props} modalComponent={modalComponent} />
}

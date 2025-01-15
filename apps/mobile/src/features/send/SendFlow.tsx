import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useBiometricsIcon } from 'src/components/icons/useBiometricsIcon'
import { useBiometricAppSettings, useBiometricPrompt, useOsBiometricAuthEnabled } from 'src/features/biometrics/hooks'
import { closeModal } from 'src/features/modals/modalSlice'
import { selectModalState } from 'src/features/modals/selectModalState'
import { SendFormScreen } from 'src/features/send/SendFormScreen'
import { SendRecipientSelectFullScreen } from 'src/features/send/SendRecipientSelectFullScreen'
import { SendReviewScreen } from 'src/features/send/SendReviewScreen'
import { useWalletRestore } from 'src/features/wallet/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ModalName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { TransactionModal } from 'uniswap/src/features/transactions/TransactionModal/TransactionModal'
import {
  TransactionScreen,
  useTransactionModalContext,
} from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { SendContextProvider, useSendContext } from 'wallet/src/features/transactions/contexts/SendContext'

export function SendFlow(): JSX.Element {
  const dispatch = useDispatch()
  const { initialState } = useSelector(selectModalState(ModalName.Send))

  const onClose = useCallback(() => {
    dispatch(closeModal({ name: ModalName.Send }))
  }, [dispatch])

  const { walletNeedsRestore, openWalletRestoreModal } = useWalletRestore()

  const isBiometricAuthEnabled = useOsBiometricAuthEnabled()
  const { requiredForTransactions } = useBiometricAppSettings()
  const { trigger: biometricsTrigger } = useBiometricPrompt()
  const useBiometricIcon = useBiometricsIcon()
  const renderBiometricsIcon =
    isBiometricAuthEnabled && requiredForTransactions && useBiometricIcon ? useBiometricIcon : null

  return (
    <TransactionModal
      renderBiometricsIcon={renderBiometricsIcon}
      authTrigger={requiredForTransactions ? biometricsTrigger : undefined}
      modalName={ModalName.Send}
      openWalletRestoreModal={openWalletRestoreModal}
      walletNeedsRestore={walletNeedsRestore}
      onClose={onClose}
    >
      <SendContextProvider prefilledTransactionState={initialState}>
        <CurrentScreen screenOverride={initialState?.sendScreen} />
      </SendContextProvider>
    </TransactionModal>
  )
}

function CurrentScreen({ screenOverride }: { screenOverride?: TransactionScreen }): JSX.Element {
  const { screen, setScreen } = useTransactionModalContext()
  const { recipient } = useSendContext()

  if (screenOverride) {
    setScreen(screenOverride)
  }

  // If no recipient, force full screen recipient select. Need to render this outside of `SendFormScreen` to ensure that
  // the modals are rendered correctly, and animations can properly measure the available space for the decimal pad.
  if (!recipient) {
    return (
      <Trace logImpression section={SectionName.SendRecipientSelectFullScreen}>
        <SendRecipientSelectFullScreen />
      </Trace>
    )
  }

  switch (screen) {
    case TransactionScreen.Form:
      return (
        <Trace logImpression section={SectionName.SendForm}>
          <SendFormScreen />
        </Trace>
      )
    case TransactionScreen.Review:
      return (
        <Trace logImpression section={SectionName.SendReview}>
          <SendReviewScreen />
        </Trace>
      )
    default:
      throw new Error(`Unknown screen: ${screen}`)
  }
}

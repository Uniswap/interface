import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useBiometricsIcon } from 'src/components/icons/useBiometricsIcon'
import { useBiometricAppSettings } from 'src/features/biometrics/useBiometricAppSettings'
import { useOsBiometricAuthEnabled } from 'src/features/biometrics/useOsBiometricAuthEnabled'
import { useBiometricPrompt } from 'src/features/biometricsSettings/hooks'
import { closeModal } from 'src/features/modals/modalSlice'
import { selectModalState } from 'src/features/modals/selectModalState'
import { SendFormScreen } from 'src/features/send/SendFormScreen'
import { SendRecipientSelectFullScreen } from 'src/features/send/SendRecipientSelectFullScreen'
import { SendReviewScreen } from 'src/features/send/SendReviewScreen'
import { useWalletRestore } from 'src/features/wallet/useWalletRestore'
import { ModalName, SectionName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TransactionSettingsStoreContextProvider } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/TransactionSettingsStoreContextProvider'
import { TransactionModal } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModal'
import {
  TransactionScreen,
  useTransactionModalContext,
} from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { SwapFormStoreContextProvider } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/SwapFormStoreContextProvider'
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
      <TransactionSettingsStoreContextProvider>
        <SwapFormStoreContextProvider>
          <SendContextProvider prefilledTransactionState={initialState}>
            <CurrentScreen screenOverride={initialState?.sendScreen} />
          </SendContextProvider>
        </SwapFormStoreContextProvider>
      </TransactionSettingsStoreContextProvider>
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

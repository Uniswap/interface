import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { BiometricsIcon } from 'src/components/icons/BiometricsIcon'
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
import { SendContextProvider, SendScreen, useSendContext } from 'wallet/src/features/transactions/contexts/SendContext'

export function SendFlow(): JSX.Element {
  const dispatch = useDispatch()
  const { initialState } = useSelector(selectModalState(ModalName.Send))

  // We need this additional `screen` state outside of the `SwapScreenContext` because the `SendContextProvider` needs to be inside the `Modal`'s `Container`.
  const [screen, setScreen] = useState<SendScreen>(SendScreen.SendForm)
  const fullscreen = screen === SendScreen.SendForm

  const onClose = useCallback(() => {
    dispatch(closeModal({ name: ModalName.Send }))
  }, [dispatch])

  const { walletNeedsRestore, openWalletRestoreModal } = useWalletRestore()

  const isBiometricAuthEnabled = useOsBiometricAuthEnabled()
  const { requiredForTransactions } = useBiometricAppSettings()
  const { trigger: biometricsTrigger } = useBiometricPrompt()
  const SendBiometricsIcon = isBiometricAuthEnabled && requiredForTransactions ? <BiometricsIcon /> : null

  return (
    <TransactionModal
      BiometricsIcon={SendBiometricsIcon}
      authTrigger={requiredForTransactions ? biometricsTrigger : undefined}
      fullscreen={fullscreen}
      modalName={ModalName.Send}
      openWalletRestoreModal={openWalletRestoreModal}
      walletNeedsRestore={walletNeedsRestore}
      onClose={onClose}
    >
      <SendContextProvider prefilledTransactionState={initialState}>
        <CurrentScreen screen={screen} setScreen={setScreen} />
      </SendContextProvider>
    </TransactionModal>
  )
}

function CurrentScreen({
  screen,
  setScreen,
}: {
  screen: SendScreen
  setScreen: Dispatch<SetStateAction<SendScreen>>
}): JSX.Element {
  const { screen: contextScreen, recipient } = useSendContext()

  useEffect(() => {
    setScreen(contextScreen)
  }, [contextScreen, setScreen])

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
    case SendScreen.SendForm:
      return (
        <Trace logImpression section={SectionName.SendForm}>
          <SendFormScreen />
        </Trace>
      )
    case SendScreen.SendReview:
      return (
        <Trace logImpression section={SectionName.SendReview}>
          <SendReviewScreen />
        </Trace>
      )
    default:
      throw new Error(`Unknown screen: ${screen}`)
  }
}

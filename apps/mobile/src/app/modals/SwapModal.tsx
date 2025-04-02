import { DdRum } from '@datadog/mobile-react-native'
import React, { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { BiometricsIconProps, useBiometricsIcon } from 'src/components/icons/useBiometricsIcon'
import { useBiometricAppSettings } from 'src/features/biometrics/useBiometricAppSettings'
import { useOsBiometricAuthEnabled } from 'src/features/biometrics/useOsBiometricAuthEnabled'
import { useBiometricPrompt } from 'src/features/biometricsSettings/hooks'
import { closeModal } from 'src/features/modals/modalSlice'
import { selectModalState } from 'src/features/modals/selectModalState'
import { useWalletRestore } from 'src/features/wallet/hooks'
import { useHapticFeedback } from 'src/utils/haptics/useHapticFeedback'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { updateSwapStartTimestamp } from 'uniswap/src/features/timing/slice'
import { useSwapPrefilledState } from 'uniswap/src/features/transactions/swap/hooks/useSwapPrefilledState'
import { WalletSwapFlow } from 'wallet/src/features/transactions/swap/WalletSwapFlow'

/* Need to track the swap modal manually until it's integrated in to react-navigation */
const DATADOG_VIEW_KEY = 'global-swap-modal'

export function SwapModal(): JSX.Element {
  const appDispatch = useDispatch()
  const { initialState } = useSelector(selectModalState(ModalName.Swap))
  const { hapticFeedback } = useHapticFeedback()

  const onClose = useCallback((): void => {
    appDispatch(closeModal({ name: ModalName.Swap }))
    DdRum.stopView(DATADOG_VIEW_KEY, {}, Date.now()).catch(() => undefined)
  }, [appDispatch])

  // Update flow start timestamp every time modal is opened for logging
  useEffect(() => {
    const timestamp = Date.now()
    DdRum.startView(DATADOG_VIEW_KEY, ModalName.Swap, {}, timestamp).catch(() => undefined)
    appDispatch(updateSwapStartTimestamp({ timestamp }))
  }, [appDispatch])

  const { openWalletRestoreModal, walletNeedsRestore } = useWalletRestore()

  const swapPrefilledState = useSwapPrefilledState(initialState)

  const { requiredForTransactions: requiresBiometrics } = useBiometricAppSettings()
  const { trigger: biometricsTrigger } = useBiometricPrompt()
  const renderBiometricsIcon = useSwapBiometricsIcon()

  return (
    <WalletSwapFlow
      renderBiometricsIcon={renderBiometricsIcon}
      authTrigger={requiresBiometrics ? biometricsTrigger : undefined}
      openWalletRestoreModal={openWalletRestoreModal}
      prefilledState={swapPrefilledState}
      walletNeedsRestore={Boolean(walletNeedsRestore)}
      onSubmitSwap={hapticFeedback.success}
      onClose={onClose}
    />
  )
}

function useSwapBiometricsIcon(): (({ color }: BiometricsIconProps) => JSX.Element) | null {
  const isBiometricAuthEnabled = useOsBiometricAuthEnabled()
  const { requiredForTransactions } = useBiometricAppSettings()
  const renderBiometricsIcon = useBiometricsIcon()

  if (isBiometricAuthEnabled && requiredForTransactions && renderBiometricsIcon) {
    return renderBiometricsIcon
  }

  return null
}

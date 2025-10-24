import React, { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { BiometricsIconProps, useBiometricsIcon } from 'src/components/icons/useBiometricsIcon'
import { useReactNavigationModal } from 'src/components/modals/useReactNavigationModal'
import { WalletRestoreType } from 'src/components/RestoreWalletModal/RestoreWalletModalState'
import { useBiometricAppSettings } from 'src/features/biometrics/useBiometricAppSettings'
import { useOsBiometricAuthEnabled } from 'src/features/biometrics/useOsBiometricAuthEnabled'
import { useBiometricPrompt } from 'src/features/biometricsSettings/hooks'
import { useWalletRestore } from 'src/features/wallet/useWalletRestore'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { clearNotificationQueue } from 'uniswap/src/features/notifications/slice/slice'
import { useHapticFeedback } from 'uniswap/src/features/settings/useHapticFeedback/useHapticFeedback'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { updateSwapStartTimestamp } from 'uniswap/src/features/timing/slice'
import { useSwapPrefilledState } from 'uniswap/src/features/transactions/swap/form/hooks/useSwapPrefilledState'
import { logger } from 'utilities/src/logger/logger'
import { WalletSwapFlow } from 'wallet/src/features/transactions/swap/WalletSwapFlow'
import { invalidateAndRefetchWalletDelegationQueries } from 'wallet/src/features/transactions/watcher/transactionFinalizationSaga'
import { useSignerAccounts } from 'wallet/src/features/wallet/hooks'

export function SwapModal({ route }: AppStackScreenProp<typeof ModalName.Swap>): JSX.Element {
  const appDispatch = useDispatch()
  const initialState = route.params
  const { hapticFeedback } = useHapticFeedback()

  const signerMnemonicAccounts = useSignerAccounts()
  const chains = useEnabledChains()
  const accountAddresses = signerMnemonicAccounts.map((account) => account.address)

  const { onClose: onCloseModal } = useReactNavigationModal()

  // Clear all notification toasts when the swap modal closes
  const onClose = useCallback(() => {
    appDispatch(clearNotificationQueue())
    onCloseModal()
  }, [appDispatch, onCloseModal])

  // Update flow start timestamp every time modal is opened for logging
  useEffect(() => {
    const timestamp = Date.now()
    appDispatch(updateSwapStartTimestamp({ timestamp }))
    invalidateAndRefetchWalletDelegationQueries({ accountAddresses, chainIds: chains.chains }).catch((error) =>
      logger.debug('SwapModal', 'useEffect', 'Failed to invalidate and refetch wallet delegation queries', error),
    )
  }, [appDispatch, accountAddresses, chains.chains])

  const { openWalletRestoreModal, walletRestoreType } = useWalletRestore()

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
      walletNeedsRestore={walletRestoreType === WalletRestoreType.NewDevice}
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

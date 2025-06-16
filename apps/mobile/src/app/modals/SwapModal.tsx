import { DdRum } from '@datadog/mobile-react-native'
import React, { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { BiometricsIconProps, useBiometricsIcon } from 'src/components/icons/useBiometricsIcon'
import { WalletRestoreType } from 'src/components/RestoreWalletModal/RestoreWalletModalState'
import { useBiometricAppSettings } from 'src/features/biometrics/useBiometricAppSettings'
import { useOsBiometricAuthEnabled } from 'src/features/biometrics/useOsBiometricAuthEnabled'
import { useBiometricPrompt } from 'src/features/biometricsSettings/hooks'
import { closeModal } from 'src/features/modals/modalSlice'
import { selectModalState } from 'src/features/modals/selectModalState'
import { useWalletRestore } from 'src/features/wallet/useWalletRestore'
import { useHapticFeedback } from 'src/utils/haptics/useHapticFeedback'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { updateSwapStartTimestamp } from 'uniswap/src/features/timing/slice'
import { useSwapPrefilledState } from 'uniswap/src/features/transactions/swap/form/hooks/useSwapPrefilledState'
import { logger } from 'utilities/src/logger/logger'
import { WalletSwapFlow } from 'wallet/src/features/transactions/swap/WalletSwapFlow'
import { invalidateAndRefetchWalletDelegationQueries } from 'wallet/src/features/transactions/watcher/transactionFinalizationSaga'
import { useSignerAccounts } from 'wallet/src/features/wallet/hooks'

/* Need to track the swap modal manually until it's integrated in to react-navigation */
const DATADOG_VIEW_KEY = 'global-swap-modal'

export function SwapModal(): JSX.Element {
  const appDispatch = useDispatch()
  const { initialState } = useSelector(selectModalState(ModalName.Swap))
  const { hapticFeedback } = useHapticFeedback()

  const signerMnemonicAccounts = useSignerAccounts()
  const chains = useEnabledChains()
  const accountAddresses = signerMnemonicAccounts.map((account) => account.address)

  const onClose = useCallback((): void => {
    appDispatch(closeModal({ name: ModalName.Swap }))
    DdRum.stopView(DATADOG_VIEW_KEY, {}, Date.now()).catch(() => undefined)
  }, [appDispatch])

  // Update flow start timestamp every time modal is opened for logging
  useEffect(() => {
    const timestamp = Date.now()
    DdRum.startView(DATADOG_VIEW_KEY, ModalName.Swap, {}, timestamp).catch(() => undefined)
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

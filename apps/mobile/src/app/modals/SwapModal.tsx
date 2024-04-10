import React, { useCallback, useEffect, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { BiometricsIcon } from 'src/components/icons/BiometricsIcon'
import {
  useBiometricAppSettings,
  useBiometricPrompt,
  useOsBiometricAuthEnabled,
} from 'src/features/biometrics/hooks'
import { closeModal } from 'src/features/modals/modalSlice'
import { selectModalState } from 'src/features/modals/selectModalState'
import { getFocusOnCurrencyFieldFromInitialState } from 'src/features/transactions/swap/utils'
import { useWalletRestore } from 'src/features/wallet/hooks'
import { SwapFormState } from 'wallet/src/features/transactions/contexts/SwapFormContext'
import { SwapFlow } from 'wallet/src/features/transactions/swap/SwapFlow'
import { ModalName } from 'wallet/src/telemetry/constants'
import { updateSwapStartTimestamp } from 'wallet/src/telemetry/timing/slice'

export function SwapModal(): JSX.Element {
  const appDispatch = useAppDispatch()
  const { initialState } = useAppSelector(selectModalState(ModalName.Swap))

  const onClose = useCallback((): void => {
    appDispatch(closeModal({ name: ModalName.Swap }))
  }, [appDispatch])

  // Update flow start timestamp every time modal is opened for logging
  useEffect(() => {
    appDispatch(updateSwapStartTimestamp({ timestamp: Date.now() }))
  }, [appDispatch])

  const { openWalletRestoreModal, walletNeedsRestore } = useWalletRestore()

  const swapPrefilledState = useMemo(
    (): SwapFormState | undefined =>
      initialState
        ? {
            customSlippageTolerance: initialState.customSlippageTolerance,
            exactAmountFiat: initialState.exactAmountFiat,
            exactAmountToken: initialState.exactAmountToken,
            exactCurrencyField: initialState.exactCurrencyField,
            focusOnCurrencyField: getFocusOnCurrencyFieldFromInitialState(initialState),
            input: initialState.input ?? undefined,
            output: initialState.output ?? undefined,
            selectingCurrencyField: initialState.selectingCurrencyField,
            txId: initialState.txId,
            isFiatMode: false,
            isSubmitting: false,
          }
        : undefined,
    [initialState]
  )

  const { requiredForTransactions: requiresBiometrics } = useBiometricAppSettings()
  const { trigger: biometricsTrigger } = useBiometricPrompt()

  return (
    <SwapFlow
      BiometricsIcon={<SwapBiometricsIcon />}
      authTrigger={requiresBiometrics ? biometricsTrigger : undefined}
      openWalletRestoreModal={openWalletRestoreModal}
      prefilledState={swapPrefilledState}
      walletNeedsRestore={Boolean(walletNeedsRestore)}
      onClose={onClose}
    />
  )
}

function SwapBiometricsIcon(): JSX.Element | null {
  const isBiometricAuthEnabled = useOsBiometricAuthEnabled()
  const { requiredForTransactions } = useBiometricAppSettings()

  return isBiometricAuthEnabled && requiredForTransactions ? <BiometricsIcon /> : null
}

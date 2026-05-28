import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { useBiometricAppSettings } from 'src/features/biometrics/useBiometricAppSettings'
import { useBiometricPrompt } from 'src/features/biometricsSettings/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'
import { setSmartWalletConsent } from 'wallet/src/features/wallet/slice'

/**
 * Hook for enabling smart wallet with biometrics in modals.
 * @returns A function that enables smart wallet with biometrics if needed
 */
export function useOnEnableSmartWallet(): () => void {
  const dispatch = useDispatch()
  const accountAddress = useActiveAccount()?.address

  const { trigger } = useBiometricPrompt()
  const { requiredForTransactions: requiresBiometrics } = useBiometricAppSettings()

  if (!accountAddress) {
    throw new Error('Account address is required')
  }

  const successAction = useCallback(() => {
    dispatch(setSmartWalletConsent({ address: accountAddress, smartWalletConsent: true }))
    navigate(ModalName.SmartWalletEnabledModal, {
      showReconnectDappPrompt: true,
    })
  }, [accountAddress, dispatch])

  return useCallback(async () => {
    if (requiresBiometrics) {
      await trigger({
        successCallback: successAction,
      })
    } else {
      successAction()
    }
  }, [requiresBiometrics, successAction, trigger])
}

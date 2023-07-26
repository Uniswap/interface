import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import { openModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { useFeatureFlag } from 'wallet/src/features/experiments/hooks'
import { logger } from 'wallet/src/features/logger/logger'
import { useNativeAccountExists } from 'wallet/src/features/wallet/hooks'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { useAppDispatch } from 'wallet/src/state'
import serializeError from 'wallet/src/utils/serializeError'

export function useWCTimeoutError(timeoutDurationInMs: number): {
  hasScanError: boolean
  setHasScanError: Dispatch<SetStateAction<boolean>>
  shouldFreezeCamera: boolean
  setShouldFreezeCamera: Dispatch<SetStateAction<boolean>>
} {
  // hook used in WalletConnectModal for WC timeout error logic
  const { t } = useTranslation()
  const [hasScanError, setHasScanError] = useState<boolean>(false)
  const [shouldFreezeCamera, setShouldFreezeCamera] = useState<boolean>(false)
  const hasScanErrorRef = useRef(hasScanError)
  const shouldFreezeCameraRef = useRef(shouldFreezeCamera)

  hasScanErrorRef.current = hasScanError
  shouldFreezeCameraRef.current = shouldFreezeCamera

  useEffect(() => {
    if (!shouldFreezeCamera) return
    // camera freezes when we attempt to connect, show timeout error if no response after 10 seconds
    const timer = setTimeout(() => {
      // don't show error if error already showing
      if (hasScanErrorRef.current || !shouldFreezeCameraRef.current) return

      setHasScanError(true)
      setShouldFreezeCamera(false)
      Alert.alert(
        t('WalletConnect error'),
        t('Please refresh the site and try connecting again.'),
        [
          {
            text: t('Try again'),
            onPress: (): void => {
              setHasScanError(false)
            },
          },
        ]
      )
    }, timeoutDurationInMs)
    return (): void => clearTimeout(timer)
  }, [shouldFreezeCamera, t, timeoutDurationInMs])

  return { hasScanError, setHasScanError, shouldFreezeCamera, setShouldFreezeCamera }
}

export function useWalletRestore(): {
  walletNeedsRestore: boolean
  openWalletRestoreModal: () => void
} {
  const dispatch = useAppDispatch()
  // Means that no private key found for mnemonic wallets
  const [walletNeedsRestore, setWalletNeedsRestore] = useState<boolean>(false)
  const hasImportedSeedPhrase = useNativeAccountExists()
  const isRestoreWalletEnabled = useFeatureFlag(FEATURE_FLAGS.RestoreWallet)

  const openWalletRestoreModal = useCallback((): void => {
    dispatch(openModal({ name: ModalName.RestoreWallet }))
  }, [dispatch])

  useEffect(() => {
    if (!hasImportedSeedPhrase || !isRestoreWalletEnabled) return
    const openRestoreWalletModalIfNeeded = async (): Promise<void> => {
      const addresses = await Keyring.getAddressesForStoredPrivateKeys()
      setWalletNeedsRestore(hasImportedSeedPhrase && !addresses.length)
    }
    openRestoreWalletModalIfNeeded().catch((error) =>
      logger.error('Error at fetching addresses from Keyring', {
        tags: {
          file: 'wallet/hooks',
          function: 'useWalletRestore',
          error: serializeError(error),
        },
      })
    )
  }, [dispatch, hasImportedSeedPhrase, isRestoreWalletEnabled])

  return { walletNeedsRestore, openWalletRestoreModal }
}

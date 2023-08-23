import { useCallback, useEffect, useState } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { openModal, selectModalState } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { serializeError } from 'utilities/src/errors'
import { logger } from 'utilities/src/logger/logger'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { useFeatureFlag } from 'wallet/src/features/experiments/hooks'
import { useNativeAccountExists } from 'wallet/src/features/wallet/hooks'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { useAppDispatch } from 'wallet/src/state'

export function useWalletRestore(params?: { openModalImmediately?: boolean }): {
  walletNeedsRestore: undefined | boolean
  openWalletRestoreModal: () => void
  isModalOpen: boolean
} {
  const dispatch = useAppDispatch()
  const openModalImmediately = params?.openModalImmediately
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

  useEffect(() => {
    if (openModalImmediately && walletNeedsRestore) {
      openWalletRestoreModal()
    }
  }, [openModalImmediately, openWalletRestoreModal, walletNeedsRestore])

  const isModalOpen = useAppSelector(selectModalState(ModalName.RestoreWallet)).isOpen

  return { walletNeedsRestore, openWalletRestoreModal, isModalOpen }
}

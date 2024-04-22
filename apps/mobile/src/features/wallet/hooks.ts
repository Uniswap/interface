import { useCallback, useEffect, useState } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { openModal } from 'src/features/modals/modalSlice'
import { selectModalState } from 'src/features/modals/selectModalState'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { logger } from 'utilities/src/logger/logger'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { useNativeAccountExists } from 'wallet/src/features/wallet/hooks'
import { useAppDispatch } from 'wallet/src/state'
import { ModalName } from 'wallet/src/telemetry/constants'

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
  const isRestoreWalletEnabled = useFeatureFlag(FeatureFlags.RestoreWallet)

  const openWalletRestoreModal = useCallback((): void => {
    dispatch(openModal({ name: ModalName.RestoreWallet }))
  }, [dispatch])

  useEffect(() => {
    if (!hasImportedSeedPhrase || !isRestoreWalletEnabled) {
      return
    }

    const openRestoreWalletModalIfNeeded = async (): Promise<void> => {
      const addresses = await Keyring.getAddressesForStoredPrivateKeys()
      setWalletNeedsRestore(hasImportedSeedPhrase && !addresses.length)
    }
    openRestoreWalletModalIfNeeded().catch((error) =>
      logger.error(error, { tags: { file: 'wallet/hooks', function: 'useWalletRestore' } })
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

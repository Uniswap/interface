import { useFocusEffect } from '@react-navigation/core'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback, useEffect, useRef, useState } from 'react'
import { navigate } from 'src/app/navigation/rootNavigation'
import { WalletRestoreType } from 'src/components/RestoreWalletModal/RestoreWalletModalState'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { logger } from 'utilities/src/logger/logger'
import { useSignerAccounts } from 'wallet/src/features/wallet/hooks'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'

type Props = {
  /**
   * If true, this hook will be responsible for opening the restore modal. Otherwise
   * the caller is responsible for opening the restore modal.
   */
  openModalImmediately?: boolean
}

/**
 * Hook to determine if the wallet needs to be restored and what type of restore is needed.
 * If a restore is needed, the relevant modal will be opened.
 */
export function useWalletRestore(params?: Props): {
  walletNeedsRestore: boolean
  openWalletRestoreModal: () => void
  walletRestoreType: WalletRestoreType
} {
  const shouldRestoreSeedPhraseFF = useFeatureFlag(FeatureFlags.EnableRestoreSeedPhrase)
  const { openModalImmediately } = params ?? {}
  const openedOnce = useRef(false)

  const [walletRestoreType, setWalletRestoreType] = useState<WalletRestoreType>(WalletRestoreType.None)
  const walletNeedsRestore = walletRestoreType !== WalletRestoreType.None
  const mnemonicIdFromLocalState = useSignerAccounts()[0]?.mnemonicId

  const openWalletRestoreModal = useCallback((): void => {
    switch (walletRestoreType) {
      case WalletRestoreType.NewDevice:
        navigate(ModalName.RestoreWallet, { restoreType: WalletRestoreType.NewDevice })
        break
      case WalletRestoreType.SeedPhrase:
        openedOnce.current = true
        navigate(ModalName.RestoreWallet, { restoreType: WalletRestoreType.SeedPhrase })
        break
      case WalletRestoreType.None:
        break
    }
  }, [walletRestoreType])

  useEffect(() => {
    checkWalletNeedsRestore(mnemonicIdFromLocalState, shouldRestoreSeedPhraseFF)
      .then((result) => {
        setWalletRestoreType(result)
      })
      .catch((error) => logger.error(error, { tags: { file: 'wallet/hooks', function: 'useWalletRestore' } }))
  }, [mnemonicIdFromLocalState, shouldRestoreSeedPhraseFF])

  useFocusEffect(
    useCallback(() => {
      if (openModalImmediately && walletNeedsRestore && !openedOnce.current) {
        openWalletRestoreModal()
      }
    }, [openModalImmediately, openWalletRestoreModal, walletNeedsRestore]),
  )

  return { walletNeedsRestore, openWalletRestoreModal, walletRestoreType }
}

/**
 * Helper to determine if the wallet needs to be restore and what
 * type of restore is needed.
 *
 * @param mnemonicId - The mnemonic ID to check. This is from our local state but not necessarily in the keyring.
 * @param shouldRestoreSeedPhraseFF - Whether the seed phrase restore is enabled
 *
 * @returns The type of restore needed
 *
 * @private exported for testing
 */
export const checkWalletNeedsRestore = async (
  mnemonicId: string | undefined,
  shouldRestoreSeedPhraseFF: boolean,
): Promise<WalletRestoreType> => {
  if (!mnemonicId) {
    return WalletRestoreType.None
  }
  const addressesWithPrivateKeys = await Keyring.getAddressesForStoredPrivateKeys()
  const mnemonicIdExists = await mnemonicIdExistsInKeyring(mnemonicId)
  const walletNeedsRestoreDevice = addressesWithPrivateKeys.length === 0 && !mnemonicIdExists
  const walletNeedsRestoreSeedPhrase =
    shouldRestoreSeedPhraseFF && addressesWithPrivateKeys.length > 0 && !mnemonicIdExists

  if (walletNeedsRestoreDevice) {
    return WalletRestoreType.NewDevice
  } else if (walletNeedsRestoreSeedPhrase) {
    return WalletRestoreType.SeedPhrase
  } else {
    return WalletRestoreType.None
  }
}

/**
 * Checks if a mnemonic ID exists in the native keyring
 *
 * @param mnemonicId - The mnemonic ID to check
 * @returns True if the mnemonic ID exists in the keyring, false otherwise
 */
const mnemonicIdExistsInKeyring = async (mnemonicId: string | undefined): Promise<boolean> => {
  if (!mnemonicId) {
    return false
  }
  const keyringMnemonicIds = await Keyring.getMnemonicIds()
  return keyringMnemonicIds.find((id) => id === mnemonicId) !== undefined
}

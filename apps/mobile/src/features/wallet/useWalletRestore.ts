import { useFocusEffect, useIsFocused } from '@react-navigation/core'
import { useCallback, useEffect, useState } from 'react'
import { navigate } from 'src/app/navigation/rootNavigation'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { logger } from 'utilities/src/logger/logger'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { useSignerAccounts } from 'wallet/src/features/wallet/hooks'

export enum WalletRestoreType {
  None = 'none',
  /**
   * The wallet needs to be restored because it is a new device. This case is
   * when the local app state has been restored but the native private keys and
   * seed phrase are not present.
   */
  NewDevice = 'device',
  /**
   * The wallet needs to be restored because the seed phrase is not present. This case
   * is when the local app state is using a wallet but it's seed phrase is missing.
   */
  SeedPhrase = 'seedPhrase',
}

type Props = {
  /**
   * Whether the modal can be dismissed. Used when the restore modal is optional and managed by the parent component.
   */
  openModalImmediately?: boolean
}

/**
 * Hook to determine if the wallet needs to be restored and what type of restoration is needed.
 * If a restoration is needed, the relevant modal will be opened.
 */
export function useWalletRestore(params?: Props): {
  walletNeedsRestore: boolean
  openWalletRestoreModal: () => void
  isModalOpen: boolean
} {
  const shouldRestoreSeedPhraseFF = useFeatureFlag(FeatureFlags.RestoreSeedPhrase)

  const openModalImmediately = params?.openModalImmediately
  const [walletRestoreType, setWalletRestoreType] = useState<WalletRestoreType>(WalletRestoreType.None)
  const walletNeedsRestore = walletRestoreType !== WalletRestoreType.None
  const mnemonicIdFromLocalState = useSignerAccounts()[0]?.mnemonicId

  const isModalOpen = useIsFocused()

  const openWalletRestoreModal = useCallback((): void => {
    switch (walletRestoreType) {
      case WalletRestoreType.NewDevice:
        navigate(ModalName.RestoreWallet)
        break
      case WalletRestoreType.SeedPhrase:
        navigate(ModalName.RestoreWallet)
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
      if (openModalImmediately && walletNeedsRestore) {
        openWalletRestoreModal()
      }
    }, [openModalImmediately, openWalletRestoreModal, walletNeedsRestore]),
  )

  return { walletNeedsRestore, openWalletRestoreModal, isModalOpen }
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

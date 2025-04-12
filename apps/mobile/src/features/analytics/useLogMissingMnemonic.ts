import { useEffect } from 'react'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { logger } from 'utilities/src/logger/logger'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { useSignerAccounts } from 'wallet/src/features/wallet/hooks'

// WALL-6234
export function useLogMissingMnemonic(): void {
  const signerMnemonicAccounts = useSignerAccounts()
  const mnemonicId = signerMnemonicAccounts[0]?.mnemonicId

  useEffect(() => {
    const logMissingMnemonic = async (): Promise<void> => {
      if (!mnemonicId) {
        return
      }

      const keyringMnemonicIds = await Keyring.getMnemonicIds()

      if (keyringMnemonicIds.find((id) => id === mnemonicId)) {
        // Ignore if mnemonic is in the keyring.
        return
      }

      const keyringPrivateKeyAddresses = await Keyring.getAddressesForStoredPrivateKeys()

      const accountsSortedByTime = signerMnemonicAccounts.sort((a, b) => a.timeImportedMs - b.timeImportedMs)

      sendAnalyticsEvent(WalletEventName.KeyringMissingMnemonic, {
        mnemonicId,
        timeImportedMsFirst: accountsSortedByTime[0]?.timeImportedMs,
        timeImportedMsLast: accountsSortedByTime[accountsSortedByTime.length - 1]?.timeImportedMs,
        keyringMnemonicIds,
        keyringPrivateKeyAddresses,
        signerMnemonicAccounts: accountsSortedByTime.map((account) => ({
          mnemonicId: account.mnemonicId,
          address: account.address,
          timeImportedMs: account.timeImportedMs,
        })),
      })
    }

    logMissingMnemonic().catch((error) => {
      logger.error(error, {
        tags: { file: 'useLogMissingMnemonic.ts', function: 'logMissingMnemonic' },
      })
    })
  }, [mnemonicId, signerMnemonicAccounts])
}

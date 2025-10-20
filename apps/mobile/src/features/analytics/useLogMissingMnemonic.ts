import { useEffect } from 'react'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { MobileUserPropertyName, setUserProperty } from 'uniswap/src/features/telemetry/user'
import { logger } from 'utilities/src/logger/logger'
import { useSignerAccounts } from 'wallet/src/features/wallet/hooks'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'

// WALL-6234
export function useLogMissingMnemonic(): void {
  const signerMnemonicAccounts = useSignerAccounts()
  const mnemonicId = signerMnemonicAccounts[0]?.mnemonicId

  /* biome-ignore lint/correctness/useExhaustiveDependencies: There's a lot of content in the signerMnemonicAccounts array, 
  so we don't want to re-run this effect on every render, just when the count of accounts changes
  */
  useEffect(() => {
    const logMissingMnemonic = async (): Promise<void> => {
      if (!mnemonicId) {
        setUserProperty(MobileUserPropertyName.HasMatchingMnemonicAndPrivateKey, 'none')
        return
      }

      const keyringMnemonicIds = await Keyring.getMnemonicIds()

      if (keyringMnemonicIds.find((id) => id === mnemonicId)) {
        // Ignore if mnemonic is in the keyring.
        setUserProperty(MobileUserPropertyName.HasMatchingMnemonicAndPrivateKey, 'true')
        return
      }

      const keyringPrivateKeyAddresses = await Keyring.getAddressesForStoredPrivateKeys()

      const accountsSortedByTime = signerMnemonicAccounts.sort((a, b) => a.timeImportedMs - b.timeImportedMs)

      setUserProperty(MobileUserPropertyName.HasMatchingMnemonicAndPrivateKey, 'false')
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
  }, [mnemonicId, signerMnemonicAccounts.length])
}

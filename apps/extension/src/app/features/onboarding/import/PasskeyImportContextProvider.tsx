import { createContext, PropsWithChildren, useCallback, useContext, useState } from 'react'
import { decryptHpkeCiphertext, generateHpkeKeypair } from 'uniswap/src/features/passkey/hpkeExport'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'

type PasskeyImportContextState = {
  importedAddress: Address | null
  /**
   * Popup returns HPKE-encrypted seed phrase bytes (from either the passkey or the
   * email/OAuth + PIN path). Extension decrypts with the keypair it provisioned and
   * feeds the plaintext into the keyring here — the mnemonic never transits the
   * message channel. Throws on decrypt or keyring import failure; callers must scrub
   * the error before logging because stacks can surface raw key bytes or partial
   * mnemonic data.
   */
  importRecoveryEncryptedSeedPhrase: (args: {
    keypair: CryptoKeyPair
    suite: Parameters<typeof decryptHpkeCiphertext>[0]['suite']
    ciphertext: string
    encapsulatedKey: string
  }) => Promise<void>
  /**
   * Allocates an HPKE keypair and returns `{ encryptionKey, keypair, suite }` to the
   * extension-side orchestrator. The pop-up only sees `encryptionKey` (SPKI base64).
   */
  provisionRecoveryHpkeKey: () => Promise<{
    encryptionKey: string
    keypair: CryptoKeyPair
    suite: Parameters<typeof decryptHpkeCiphertext>[0]['suite']
  }>
}

const PasskeyImportContext = createContext<PasskeyImportContextState | undefined>(undefined)

export function PasskeyImportContextProvider({ children }: PropsWithChildren): JSX.Element {
  const [importedAddress, setImportedAddress] = useState<Address | null>(null)

  const { addOnboardingAccountMnemonic } = useOnboardingContext()

  const importMnemonic = useCallback(
    async (mnemonic: string): Promise<void> => {
      const account = await Keyring.importMnemonic(mnemonic)
      addOnboardingAccountMnemonic(mnemonic.split(' '))
      setImportedAddress(account)
    },
    [addOnboardingAccountMnemonic],
  )

  const provisionRecoveryHpkeKey = useCallback<PasskeyImportContextState['provisionRecoveryHpkeKey']>(async () => {
    const { suite, keypair, publicKeyBase64 } = await generateHpkeKeypair()
    return { encryptionKey: publicKeyBase64, keypair, suite }
  }, [])

  const importRecoveryEncryptedSeedPhrase = useCallback<PasskeyImportContextState['importRecoveryEncryptedSeedPhrase']>(
    async ({ keypair, suite, ciphertext, encapsulatedKey }) => {
      const mnemonic = await decryptHpkeCiphertext({ suite, keypair, ciphertext, encapsulatedKey })
      await importMnemonic(mnemonic)
    },
    [importMnemonic],
  )

  return (
    <PasskeyImportContext.Provider
      value={{
        importedAddress,
        importRecoveryEncryptedSeedPhrase,
        provisionRecoveryHpkeKey,
      }}
    >
      {children}
    </PasskeyImportContext.Provider>
  )
}

export const usePasskeyImportContext = (): PasskeyImportContextState => {
  const passkeyImportContext = useContext(PasskeyImportContext)
  if (passkeyImportContext === undefined) {
    throw new Error('usePasskeyImportContext must be inside a PasskeyImportContextProvider')
  }
  return passkeyImportContext
}

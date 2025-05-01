import { createContext, PropsWithChildren, useCallback, useContext, useState } from 'react'
import { logger } from 'utilities/src/logger/logger'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { fetchSeedPhrase } from 'wallet/src/features/passkeys/passkeys'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'

type PasskeyImportContextState = {
  importedAddress: Address | null
  importError: Error | null
  importWithCredential: (credential: string) => Promise<void>
}

const PasskeyImportContext = createContext<PasskeyImportContextState | undefined>(undefined)

export function PasskeyImportContextProvider({ children }: PropsWithChildren): JSX.Element {
  const [importedAddress, setImportedAddress] = useState<Address | null>(null)
  const [importError, setImportError] = useState<Error | null>(null)

  const { addOnboardingAccountMnemonic } = useOnboardingContext()

  const importWithCredential = useCallback(
    async (credential: string): Promise<void> => {
      try {
        const mnemonic = await fetchSeedPhrase(credential)
        const account = await Keyring.importMnemonic(mnemonic)
        addOnboardingAccountMnemonic(mnemonic.split(' '))
        setImportedAddress(account)
      } catch (caughtError) {
        logger.error(caughtError, {
          tags: {
            file: 'PasskeyImportContextProvider.tsx',
            function: 'importWithCredential',
          },
        })
        const error =
          caughtError instanceof Error ? caughtError : new Error('Failed to import passkey', { cause: caughtError })
        setImportError(error)
      }
    },
    [addOnboardingAccountMnemonic],
  )

  return (
    <PasskeyImportContext.Provider
      value={{
        importedAddress,
        importError,
        importWithCredential,
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

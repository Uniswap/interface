import {
  Action,
  AuthenticationTypes,
  Authenticator,
  RegistrationOptions_AuthenticatorAttachment as AuthenticatorAttachment,
  RegistrationOptions,
} from '@uniswap/client-embeddedwallet/dist/uniswap/embeddedwallet/v1/service_pb'
import {
  fetchChallengeRequest,
  fetchCreateWalletRequest,
  fetchDeleteAuthenticatorRequest,
  fetchDisconnectRequest,
  fetchExportSeedPhraseRequest,
  fetchListAuthenticatorsRequest,
  fetchRegisterNewAuthenticatorRequest,
  fetchSignMessagesRequest,
  fetchSignTransactionRequest,
  fetchSignTypedDataRequest,
  fetchWalletSigninRequest,
} from 'uniswap/src/data/rest/embeddedWallet/requests'
import { authenticatePasskey, registerPasskey } from 'uniswap/src/features/passkey/passkey'
import { isAddress } from 'utilities/src/addresses'
import { logger } from 'utilities/src/logger/logger'

export {
  Action,
  Authenticator,
  RegistrationOptions_AuthenticatorAttachment as AuthenticatorAttachment,
  AuthenticatorNameType,
} from '@uniswap/client-embeddedwallet/dist/uniswap/embeddedwallet/v1/service_pb'

// Registration
async function registerNewPasskey({
  username,
  authenticatorAttachment,
  action,
}: {
  username?: string
  authenticatorAttachment?: AuthenticatorAttachment
  action?: Action
} = {}): Promise<string | undefined> {
  const options: RegistrationOptions = { authenticatorAttachment, username } as RegistrationOptions
  try {
    const challenge = await fetchChallengeRequest({
      type: AuthenticationTypes.PASSKEY_REGISTRATION,
      action: action ?? Action.CREATE_WALLET,
      options,
    })
    return await registerPasskey(challenge.challengeOptions)
  } catch (registrationError: unknown) {
    if (registrationError instanceof Error && registrationError.name === 'AbortError') {
      logger.debug('embeddedWallet.ts', 'registerNewPasskey', 'User aborted registration')
    } else {
      logger.debug('embeddedWallet.ts', 'registerNewPasskey', `Error during registration: ${registrationError}`)
    }
    throw registrationError
  }
}

export async function createNewEmbeddedWallet(unitag: string): Promise<`0x${string}` | undefined> {
  try {
    const passkeyCredential = await registerNewPasskey({ username: unitag })
    if (!passkeyCredential) {
      return undefined
    }

    const createWalletResp = await fetchCreateWalletRequest({ credential: passkeyCredential })
    if (createWalletResp?.walletAddress) {
      logger.debug(
        'embeddedWallet.ts',
        'createNewEmbeddedWallet',
        `New wallet created: ${createWalletResp.walletAddress}`,
      )
      if (!isAddress(createWalletResp.walletAddress)) {
        logger.error(new Error('Invalid address returned from create wallet response'), {
          tags: {
            file: 'embeddedWallet.ts',
            function: 'createNewEmbeddedWallet',
          },
        })
        return undefined
      }
      return createWalletResp.walletAddress as `0x${string}`
    }
    return undefined
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'embeddedWallet.ts',
        function: 'createNewEmbeddedWallet',
      },
    })
    throw error
  }
}

// Authentication

export async function authenticateWithPasskey(action: Action): Promise<string | undefined> {
  try {
    const challenge = await fetchChallengeRequest({
      type: AuthenticationTypes.PASSKEY_AUTHENTICATION,
      action,
    })
    return await authenticatePasskey(challenge.challengeOptions)
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      logger.debug('embeddedWallet.ts', 'authenticateWithPasskey', 'User aborted the registration process')
    } else {
      logger.error(new Error('Error during registration', { cause: error }), {
        tags: {
          file: 'embeddedWallet.ts',
          function: 'authenticateWithPasskey',
        },
      })
    }
    throw error
  }
}

export async function authenticateWithPasskeyForSeedPhraseExport(): Promise<string | undefined> {
  return await authenticateWithPasskey(Action.EXPORT_SEED_PHRASE)
}

export async function signInWithPasskey(): Promise<`0x${string}` | undefined> {
  try {
    const credential = await authenticateWithPasskey(Action.WALLET_SIGNIN)
    if (!credential) {
      return undefined
    }
    const signInResp = await fetchWalletSigninRequest({ credential })
    if (signInResp?.walletAddress) {
      return signInResp.walletAddress as `0x${string}`
    }
    return undefined
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'embeddedWallet.ts',
        function: 'signInWithPasskey',
      },
    })
    throw error
  }
}

export async function signMessagesWithPasskey(messages: string[]): Promise<string[] | undefined> {
  try {
    const credential = await authenticateWithPasskey(Action.SIGN_MESSAGES)
    const signedMessagesResp = await fetchSignMessagesRequest({ messages, credential })
    return signedMessagesResp.signedMessages
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'embeddedWallet.ts',
        function: 'signMessagesWithPasskey',
      },
    })
    throw error
  }
}

export async function signTransactionWithPasskey(transactions: string[]): Promise<string[] | undefined> {
  try {
    const credential = await authenticateWithPasskey(Action.SIGN_TRANSACTIONS)
    const signedTransactionResp = await fetchSignTransactionRequest({
      transactions,
      credential,
    })
    return signedTransactionResp.signedTransactions
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'embeddedWallet.ts',
        function: 'signTransactionWithPasskey',
      },
    })
    throw error
  }
}

export async function signTypedDataWithPasskey(typedDataBatch: string[]): Promise<string[] | undefined> {
  try {
    const credential = await authenticateWithPasskey(Action.SIGN_TYPED_DATA_BATCH)
    const signedTypedDataResp = await fetchSignTypedDataRequest({
      typedDataBatch,
      credential,
    })
    return signedTypedDataResp.signature
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'embeddedWallet.ts',
        function: 'signTypedDataWithPasskey',
      },
    })
    throw error
  }
}

export async function exportEncryptedSeedPhrase(encryptionKey: string): Promise<string | undefined> {
  try {
    const credential = await authenticateWithPasskey(Action.EXPORT_SEED_PHRASE)
    if (!credential) {
      return undefined
    }
    const seedPhraseResp = await fetchExportSeedPhraseRequest({
      encryptionKey,
      credential,
    })
    return seedPhraseResp.encryptedSeedPhrase
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'embeddedWallet.ts',
        function: 'exportEncryptedSeedPhrase',
      },
    })
    throw error
  }
}

export async function disconnectWallet(): Promise<void> {
  try {
    await fetchDisconnectRequest()
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'embeddedWallet.ts',
        function: 'disconnectWallet',
      },
    })
    throw error
  }
}

export async function listAuthenticators(): Promise<Authenticator[]> {
  try {
    const credential = await authenticateWithPasskey(Action.LIST_AUTHENTICATORS)
    const listAuthenticatorsResp = await fetchListAuthenticatorsRequest({ credential: JSON.stringify(credential) })
    return listAuthenticatorsResp.authenticators
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'embeddedWallet.ts',
        function: 'listAuthenticators',
      },
    })
    throw error
  }
}

export async function registerNewAuthenticator({
  authenticatorAttachment,
  existingCredential,
  username,
}: {
  authenticatorAttachment: AuthenticatorAttachment
  existingCredential?: string
  username?: string
}): Promise<boolean | undefined> {
  try {
    const newPasskeyCredential = await registerNewPasskey({
      authenticatorAttachment,
      action: Action.REGISTER_NEW_AUTHENTICATION_TYPES,
      username,
    })
    if (newPasskeyCredential && existingCredential) {
      await fetchRegisterNewAuthenticatorRequest({
        newCredential: newPasskeyCredential,
        newAuthenticationType: AuthenticationTypes.PASSKEY_REGISTRATION,
        existingCredential,
        existingAuthenticationType: AuthenticationTypes.PASSKEY_AUTHENTICATION,
      })
      return true
    }
    return false
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'embeddedWallet.ts',
        function: 'registerNewAuthenticator',
      },
    })
    throw error
  }
}

export async function deleteAuthenticator({
  authenticator,
  credential,
}: {
  authenticator: Authenticator
  credential?: string
}): Promise<boolean | undefined> {
  try {
    if (credential) {
      await fetchDeleteAuthenticatorRequest({
        credential,
        authenticationType: AuthenticationTypes.PASSKEY_AUTHENTICATION,
        authenticatorId: authenticator.id,
        authenticatorType: authenticator.type,
      })
      return true
    }
    return false
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'embeddedWallet.ts',
        function: 'deleteAuthenticator',
      },
    })
    throw error
  }
}

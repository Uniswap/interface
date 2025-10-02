import {
  Action,
  AuthenticationTypes,
  Authenticator,
  RegistrationOptions_AuthenticatorAttachment as AuthenticatorAttachment,
  ChallengeResponse,
  RegistrationOptions,
  WalletSigninResponse,
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
  fetchSignTransactionsRequest,
  fetchSignTypedDataRequest,
  fetchWalletSigninRequest,
} from 'uniswap/src/data/rest/embeddedWallet/requests'
import { authenticatePasskey, registerPasskey } from 'uniswap/src/features/passkey/passkey'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { HexString } from 'utilities/src/addresses/hex'
import { logger } from 'utilities/src/logger/logger'

export {
  Action,
  Authenticator,
  AuthenticatorNameType,
  RegistrationOptions_AuthenticatorAttachment as AuthenticatorAttachment,
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

export async function createNewEmbeddedWallet(unitag: string): Promise<HexString | undefined> {
  try {
    const passkeyCredential = await registerNewPasskey({ username: unitag })
    if (!passkeyCredential) {
      return undefined
    }

    const createWalletResp = await fetchCreateWalletRequest({ credential: passkeyCredential })
    if (createWalletResp.walletAddress) {
      logger.debug(
        'embeddedWallet.ts',
        'createNewEmbeddedWallet',
        `New wallet created: ${createWalletResp.walletAddress}`,
      )
      const address = getValidAddress({
        address: createWalletResp.walletAddress,
        platform: Platform.EVM,
        withEVMChecksum: true,
      })
      if (!address) {
        logger.error(new Error('Invalid address returned from create wallet response'), {
          tags: {
            file: 'embeddedWallet.ts',
            function: 'createNewEmbeddedWallet',
          },
        })
        return undefined
      }
      return address as HexString
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
export async function isSessionAuthenticatedForAction(action: Action): Promise<boolean> {
  if (!SESSION_ACTIONS.includes(action)) {
    return false
  }

  try {
    const challenge = await fetchChallengeRequest({
      type: AuthenticationTypes.PASSKEY_AUTHENTICATION,
      action,
    })
    return challenge.challengeOptions.length === 0
  } catch (_error) {
    return false
  }
}

// Actions that do not require authentication while a user is signed in
const SESSION_ACTIONS = [
  Action.SIGN_MESSAGES,
  Action.SIGN_TRANSACTIONS,
  Action.SIGN_TYPED_DATA_BATCH,
  Action.LIST_AUTHENTICATORS,
  Action.ACTION_UNSPECIFIED,
]

async function reauthenticateSessionWithPasskey(action: Action, walletAddress?: string): Promise<ChallengeResponse> {
  // to restart a new session, we first need to sign in, and then get a new challenge
  const signinResponse = await signInWithPasskey()
  if (!signinResponse) {
    throw new Error('Failed to re-authenticate')
  }
  // TODO(WEB-7785): replace with passing wallet address to sign in request once backend is updated
  // make sure the signed in wallet address is the same as the wallet address we are trying to authenticate with
  if (walletAddress && signinResponse.walletAddress !== walletAddress) {
    // We need to disconnect to nullify the incorrect session
    await disconnectWallet()
    throw new Error('not_found: Failed to re-authenticate with correct passkey [00000000-0000-0000-0000-000000000000]')
  }
  return await fetchChallengeRequest({
    type: AuthenticationTypes.PASSKEY_AUTHENTICATION,
    action,
  })
}

export async function authenticateWithPasskey(action: Action, walletAddress?: string): Promise<string | undefined> {
  let challenge: ChallengeResponse | undefined
  try {
    challenge = await fetchChallengeRequest({
      type: AuthenticationTypes.PASSKEY_AUTHENTICATION,
      action,
    })
    // if challengeOptions is defined but the action is a session action, it means the session has expired and we need to reauthenticate
    if (challenge.challengeOptions && SESSION_ACTIONS.includes(action)) {
      challenge = await reauthenticateSessionWithPasskey(action, walletAddress)
    }
    return await authenticatePasskey(challenge.challengeOptions)
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      logger.debug('embeddedWallet.ts', 'authenticateWithPasskey', 'User aborted the registration process')
      return undefined
    } else {
      logger.error(new Error('Error during authentication', { cause: error }), {
        tags: {
          file: 'embeddedWallet.ts',
          function: 'authenticateWithPasskey',
        },
      })
      throw error
    }
  }
}

export async function authenticateWithPasskeyForSeedPhraseExport(): Promise<string | undefined> {
  return await authenticateWithPasskey(Action.EXPORT_SEED_PHRASE)
}

export async function signInWithPasskey(): Promise<WalletSigninResponse | undefined> {
  try {
    const credential = await authenticateWithPasskey(Action.WALLET_SIGNIN)
    if (!credential) {
      return undefined
    }
    const signInResp = await fetchWalletSigninRequest({ credential })
    if (signInResp.walletAddress) {
      return signInResp
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

export async function signMessagesWithPasskey(
  messages: string[],
  walletAddress?: string,
): Promise<string[] | undefined> {
  try {
    const credential = await authenticateWithPasskey(Action.SIGN_MESSAGES, walletAddress)
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

export async function signTransactionsWithPasskey(
  transactions: string[],
  walletAddress?: string,
): Promise<string[] | undefined> {
  try {
    const credential = await authenticateWithPasskey(Action.SIGN_TRANSACTIONS, walletAddress)
    const signedTransactionResp = await fetchSignTransactionsRequest({
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

export async function signTypedDataWithPasskey(
  typedDataBatch: string[],
  walletAddress?: string,
): Promise<string[] | undefined> {
  try {
    const credential = await authenticateWithPasskey(Action.SIGN_TYPED_DATA_BATCH, walletAddress)
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

export async function listAuthenticators(walletAddress?: string): Promise<Authenticator[]> {
  try {
    const credential = await authenticateWithPasskey(Action.LIST_AUTHENTICATORS, walletAddress)
    const listAuthenticatorsResp = await fetchListAuthenticatorsRequest({ credential })
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

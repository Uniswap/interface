import { Authenticator } from '@uniswap/client-embeddedwallet/dist/uniswap/embeddedwallet/v1/service_pb'
import type {
  Action,
  RegistrationOptions_AuthenticatorAttachment as AuthenticatorAttachment,
  ChallengeResponse,
  RegistrationOptions,
} from '@uniswap/client-privy-embedded-wallet/dist/uniswap/privy-embedded-wallet/v1/service_pb'
import { EmbeddedWalletApiClient } from 'uniswap/src/data/rest/embeddedWallet/requests'
import { authenticatePasskey, registerPasskey } from 'uniswap/src/features/passkey/passkey'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { HexString } from 'utilities/src/addresses/hex'
import { logger } from 'utilities/src/logger/logger'

export {
  Authenticator,
  AuthenticatorNameType,
} from '@uniswap/client-embeddedwallet/dist/uniswap/embeddedwallet/v1/service_pb'
export type {
  Action,
  AuthenticationTypes,
  RegistrationOptions_AuthenticatorAttachment as AuthenticatorAttachment,
} from '@uniswap/client-privy-embedded-wallet/dist/uniswap/privy-embedded-wallet/v1/service_pb'

type PrivyPbModule =
  typeof import('@uniswap/client-privy-embedded-wallet/dist/uniswap/privy-embedded-wallet/v1/service_pb')

let _privyPbModulePromise: Promise<PrivyPbModule> | undefined

async function loadPrivyPbModule(): Promise<PrivyPbModule> {
  if (!_privyPbModulePromise) {
    _privyPbModulePromise = (async (): Promise<PrivyPbModule> => {
      try {
        return await import(
          /* @vite-ignore */
          '@uniswap/client-privy-embedded-wallet/dist/uniswap/privy-embedded-wallet/v1/service_pb'
        )
      } catch {
        throw new Error('Embedded Wallet requires @uniswap/client-privy-embedded-wallet (private Uniswap package).')
      }
    })()
  }
  return _privyPbModulePromise
}

loadPrivyPbModule().catch(() => {
  // Expected to fail without NPM_READ_ONLY_TOKEN
})

export async function getPrivyEnums(): Promise<{
  Action: PrivyPbModule['Action']
  AuthenticationTypes: PrivyPbModule['AuthenticationTypes']
  AuthenticatorAttachment: PrivyPbModule['RegistrationOptions_AuthenticatorAttachment']
}> {
  const {
    Action,
    AuthenticationTypes,
    RegistrationOptions_AuthenticatorAttachment: AuthenticatorAttachment,
  } = await loadPrivyPbModule()
  return { Action, AuthenticationTypes, AuthenticatorAttachment }
}

async function registerNewPasskey({
  username,
  authenticatorAttachment,
  action,
}: {
  username?: string
  authenticatorAttachment?: AuthenticatorAttachment
  action?: Action
} = {}): Promise<{ credential: string } | undefined> {
  const { AuthenticationTypes, Action: ActionEnum } = await loadPrivyPbModule()
  const options = { authenticatorAttachment, username } as unknown as RegistrationOptions
  try {
    const challengeJson = await EmbeddedWalletApiClient.fetchChallengeRequest({
      type: AuthenticationTypes.PASSKEY_REGISTRATION,
      action: action ?? ActionEnum.CREATE_WALLET,
      options,
    })
    const passkeyCredential = await registerPasskey(challengeJson.challengeOptions)
    return { credential: passkeyCredential }
  } catch (registrationError: unknown) {
    if (registrationError instanceof Error && registrationError.name === 'AbortError') {
      logger.debug('embeddedWallet.ts', 'registerNewPasskey', 'User aborted registration')
    } else {
      logger.debug('embeddedWallet.ts', 'registerNewPasskey', `Error during registration: ${registrationError}`)
    }
    throw registrationError
  }
}

export async function createNewEmbeddedWallet(
  unitag: string,
): Promise<{ address: HexString; walletId: string } | undefined> {
  try {
    const passkeyRegistration = await registerNewPasskey({ username: unitag })
    if (!passkeyRegistration) {
      return undefined
    }
    const { credential: passkeyCredential } = passkeyRegistration

    const createWalletResp = await EmbeddedWalletApiClient.fetchCreateWalletRequest({
      credential: passkeyCredential,
    })
    if (createWalletResp.walletAddress && createWalletResp.walletId) {
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
      return { address: address as HexString, walletId: createWalletResp.walletId }
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

export async function isSessionAuthenticatedForAction(action: Action): Promise<boolean> {
  // TODO[INFRA-1212]: Implement user sessions
  return false
  // if (!SESSION_ACTIONS.includes(action)) {
  //   return false
  // }

  // try {
  //   const challenge = await EmbeddedWalletApiClient.fetchChallengeRequest({
  //     type: AuthenticationTypes.PASSKEY_AUTHENTICATION,
  //     action,
  //   })
  //   return challenge.challengeOptions.length === 0
  // } catch (_error) {
  //   return false
  // }
}

// Actions that do not require authentication while a user is signed in
// const SESSION_ACTIONS = [
//   Action.SIGN_MESSAGE,
//   Action.SIGN_TRANSACTION,
//   Action.SIGN_TYPED_DATA,
//   Action.LIST_AUTHENTICATORS,
//   Action.ACTION_UNSPECIFIED,
// ]

async function _reauthenticateSessionWithPasskey(action: Action, walletId?: string): Promise<ChallengeResponse> {
  const { AuthenticationTypes } = await loadPrivyPbModule()
  const signinResponse = await signInWithPasskey()
  if (!signinResponse) {
    throw new Error('Failed to re-authenticate')
  }
  return await EmbeddedWalletApiClient.fetchChallengeRequest({
    type: AuthenticationTypes.PASSKEY_AUTHENTICATION,
    action,
    walletId: walletId ?? signinResponse.walletId,
  })
}

export async function authenticateWithPasskey(
  action: Action,
  options?: {
    walletId?: string
    message?: string
    transaction?: string
    typedData?: string
    encryptionKey?: string
  },
): Promise<string | undefined> {
  const { AuthenticationTypes } = await loadPrivyPbModule()
  let challenge: ChallengeResponse | undefined
  try {
    challenge = await EmbeddedWalletApiClient.fetchChallengeRequest({
      type: AuthenticationTypes.PASSKEY_AUTHENTICATION,
      action,
      walletId: options?.walletId,
      message: options?.message,
      transaction: options?.transaction,
      typedData: options?.typedData,
    })
    // // if challengeOptions is defined but the action is a session action, it means the session has expired and we need to reauthenticate
    // if (challenge.challengeOptions && SESSION_ACTIONS.includes(action)) {
    //   challenge = await reauthenticateSessionWithPasskey(action, walletId)
    // }
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

export async function authenticateWithPasskeyForSeedPhraseExport(walletId?: string): Promise<string | undefined> {
  const { Action } = await loadPrivyPbModule()
  return await authenticateWithPasskey(Action.EXPORT_SEED_PHRASE, { walletId })
}

export async function signInWithPasskey(): Promise<
  { walletAddress: string; walletId: string; exported?: boolean } | undefined
> {
  const { Action } = await loadPrivyPbModule()
  try {
    const credential = await authenticateWithPasskey(Action.WALLET_SIGNIN)
    if (!credential) {
      return undefined
    }
    const signInRespJson = await EmbeddedWalletApiClient.fetchWalletSigninRequest({ credential })
    if (signInRespJson.walletAddress) {
      return signInRespJson
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

export async function signMessageWithPasskey(message: string, walletId?: string): Promise<string | undefined> {
  const { Action } = await loadPrivyPbModule()
  try {
    const credential = await authenticateWithPasskey(Action.SIGN_MESSAGE, { walletId, message })
    const signedMessagesRespJson = await EmbeddedWalletApiClient.fetchSignMessagesRequest({
      messages: [message],
      credential,
    })
    return signedMessagesRespJson.signatures[0]
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

export async function signTransactionWithPasskey(transaction: string, walletId?: string): Promise<string | undefined> {
  const { Action } = await loadPrivyPbModule()
  try {
    const credential = await authenticateWithPasskey(Action.SIGN_TRANSACTION, { walletId, transaction })
    const signedTransactionRespJson = await EmbeddedWalletApiClient.fetchSignTransactionsRequest({
      transactions: [transaction],
      credential,
    })
    return signedTransactionRespJson.signatures[0]
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

export async function signTypedDataWithPasskey(typedData: string, walletId?: string): Promise<string | undefined> {
  const { Action } = await loadPrivyPbModule()
  try {
    const credential = await authenticateWithPasskey(Action.SIGN_TYPED_DATA, { walletId, typedData })
    const signedTypedDataRespJson = await EmbeddedWalletApiClient.fetchSignTypedDataRequest({
      typedDataBatch: [typedData],
      credential,
    })
    return signedTypedDataRespJson.signatures[0]
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

export async function exportEncryptedSeedPhrase(encryptionKey: string, walletId?: string): Promise<string | undefined> {
  const { Action } = await loadPrivyPbModule()
  try {
    const credential = await authenticateWithPasskey(Action.EXPORT_SEED_PHRASE, { walletId, encryptionKey })
    if (!credential) {
      return undefined
    }
    const seedPhraseResp = await EmbeddedWalletApiClient.fetchExportSeedPhraseRequest({
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
    await EmbeddedWalletApiClient.fetchDisconnectRequest()
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

export async function listAuthenticators(walletId?: string): Promise<Authenticator[]> {
  // TODO[INFRA-1218]: Implement list authenticators with new service
  return []
  // try {
  //   const credential = await authenticateWithPasskey(Action.LIST_AUTHENTICATORS, { walletId })
  //   const listAuthenticatorsResp = await EmbeddedWalletApiClient.fetchListAuthenticatorsRequest({ credential })
  //   return listAuthenticatorsResp.authenticators
  // } catch (error) {
  //   logger.error(error, {
  //     tags: {
  //       file: 'embeddedWallet.ts',
  //       function: 'listAuthenticators',
  //     },
  //   })
  //   throw error
  // }
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
  const { Action, AuthenticationTypes } = await loadPrivyPbModule()
  try {
    const newPasskeyRegistration = await registerNewPasskey({
      authenticatorAttachment,
      action: Action.REGISTER_NEW_AUTHENTICATION_TYPES,
      username,
    })
    if (newPasskeyRegistration && existingCredential) {
      await EmbeddedWalletApiClient.fetchRegisterNewAuthenticatorRequest({
        newCredential: newPasskeyRegistration.credential,
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
  const { AuthenticationTypes } = await loadPrivyPbModule()
  try {
    if (credential) {
      await EmbeddedWalletApiClient.fetchDeleteAuthenticatorRequest({
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

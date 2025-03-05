import { createPromiseClient } from '@connectrpc/connect'
import { createConnectTransport } from '@connectrpc/connect-web'
import { startAuthentication, startRegistration } from '@simplewebauthn/browser'
import {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/types'
import { EmbeddedWalletService } from '@uniswap/client-embeddedwallet/dist/uniswap/embeddedwallet/v1/service_connect'
import {
  Action,
  AuthenticationTypes,
  ChallengeResponse,
  CreateWalletResponse,
  ExportSeedPhraseResponse,
  SignMessagesResponse,
  SignTransactionsResponse,
  SignTypedDataBatchResponse,
  WalletSigninResponse,
} from '@uniswap/client-embeddedwallet/dist/uniswap/embeddedwallet/v1/service_pb'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { SharedQueryClient } from 'uniswap/src/data/apiClients/SharedQueryClient'
import { isAddress } from 'utilities/src/addresses'
import { logger } from 'utilities/src/logger/logger'

const enclaveTransport = createConnectTransport({
  baseUrl: uniswapUrls.evervaultDevUrl,
  credentials: 'include',
})
export const EMBEDDED_WALLET_CLIENT = createPromiseClient(EmbeddedWalletService, enclaveTransport)

/* DATA FETCHING FUNCTIONS */
export async function fetchChallengeRequest({
  type,
  action,
}: {
  type: AuthenticationTypes
  action: Action
}): Promise<ChallengeResponse> {
  return await SharedQueryClient.fetchQuery({
    queryKey: ['challenge', type, action],
    queryFn: () => EMBEDDED_WALLET_CLIENT.challenge({ type, action }),
  })
}
async function fetchCreateWalletRequest({ credential }: { credential: string }): Promise<CreateWalletResponse> {
  return await SharedQueryClient.fetchQuery({
    queryKey: ['createWallet', credential],
    queryFn: () => EMBEDDED_WALLET_CLIENT.createWallet({ credential }),
  })
}
async function fetchWalletSigninRequest({ credential }: { credential: string }): Promise<WalletSigninResponse> {
  return await SharedQueryClient.fetchQuery({
    queryKey: ['walletSignin', credential],
    queryFn: () => EMBEDDED_WALLET_CLIENT.walletSignin({ credential }),
  })
}

async function fetchSignMessagesRequest({
  messages,
  credential,
}: {
  messages: string[]
  credential: string
}): Promise<SignMessagesResponse> {
  return await SharedQueryClient.fetchQuery({
    queryKey: ['signMessages', messages, credential],
    queryFn: () => EMBEDDED_WALLET_CLIENT.signMessages({ messages, credential }),
  })
}

async function fetchSignTransactionRequest({
  transactions,
  credential,
}: {
  transactions: string[]
  credential: string
}): Promise<SignTransactionsResponse> {
  return await SharedQueryClient.fetchQuery({
    queryKey: ['signTransaction', transactions, credential],
    queryFn: () => EMBEDDED_WALLET_CLIENT.signTransactions({ transactions, credential }),
  })
}

async function fetchSignTypedDataRequest({
  typedDataBatch,
  credential,
}: {
  typedDataBatch: string[]
  credential: string
}): Promise<SignTypedDataBatchResponse> {
  return await SharedQueryClient.fetchQuery({
    queryKey: ['signTypedData', typedDataBatch, credential],
    queryFn: () => EMBEDDED_WALLET_CLIENT.signTypedDataBatch({ typedDataBatch, credential }),
  })
}

async function fetchExportSeedPhraseRequest({
  encryptionKey,
  credential,
}: {
  encryptionKey: string
  credential: string
}): Promise<ExportSeedPhraseResponse> {
  return await SharedQueryClient.fetchQuery({
    queryKey: ['exportSeedPhrase', credential, encryptionKey],
    queryFn: () => EMBEDDED_WALLET_CLIENT.exportSeedPhrase({ credential, b64EncryptionPublicKey: encryptionKey }),
  })
}

async function fetchDisconnectRequest(): Promise<void> {
  return await SharedQueryClient.fetchQuery({
    queryKey: ['disconnect'],
    queryFn: () => EMBEDDED_WALLET_CLIENT.disconnectWallet({}),
  })
}

/* UTILITY FUNCTIONS */
async function registerNewPasskey(): Promise<RegistrationResponseJSON | undefined> {
  try {
    const challenge = await fetchChallengeRequest({
      type: AuthenticationTypes.PASSKEY_REGISTRATION,
      action: Action.CREATE_WALLET,
    })
    if (challenge?.challengeOptions) {
      const challengeJson = JSON.parse(challenge.challengeOptions) as PublicKeyCredentialCreationOptionsJSON
      const authResp = await startRegistration({ optionsJSON: challengeJson })
      return authResp
    }
  } catch (registrationError: unknown) {
    if (registrationError instanceof Error && registrationError.name === 'AbortError') {
      logger.debug('embeddedWallet.ts', 'registerNewPasskey', 'User aborted registration')
    } else {
      // TODO[EW]: Add more in depth error handling
      logger.debug('embeddedWallet.ts', 'registerNewPasskey', `Error during registration: ${registrationError}`)
    }
    return undefined
  }
  logger.debug('embeddedWallet.ts', 'registerNewPasskey', 'Error parsing challenge response')
  return undefined
}

export async function createNewEmbeddedWallet(): Promise<`0x${string}` | undefined> {
  try {
    const passkeyCredential = await registerNewPasskey()
    if (passkeyCredential) {
      const createWalletResp = await fetchCreateWalletRequest({ credential: JSON.stringify(passkeyCredential) })
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
    }
    return undefined
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'embeddedWallet.ts',
        function: 'createNewEmbeddedWallet',
      },
    })
    return undefined
  }
}

export async function authenticateWithPasskey(action: Action): Promise<AuthenticationResponseJSON | undefined> {
  try {
    const challenge = await fetchChallengeRequest({
      type: AuthenticationTypes.PASSKEY_AUTHENTICATION,
      action,
    })
    if (challenge?.challengeOptions) {
      const challengeJson = JSON.parse(challenge.challengeOptions) as PublicKeyCredentialCreationOptionsJSON
      const authResp = await startAuthentication({ optionsJSON: challengeJson })
      return authResp
    }
  } catch (registrationError: unknown) {
    if (registrationError instanceof Error && registrationError.name === 'AbortError') {
      logger.debug('embeddedWallet.ts', 'authenticateWithPasskey', 'User aborted the registration process')
    } else {
      logger.error(new Error('Error during registration'), {
        tags: {
          file: 'embeddedWallet.ts',
          function: 'authenticateWithPasskey',
        },
      })
    }
    return undefined
  }
  return undefined
}

export async function signInWithPasskey(): Promise<`0x${string}` | undefined> {
  try {
    const authResponse = await authenticateWithPasskey(Action.WALLET_SIGNIN)
    if (authResponse) {
      const signInResp = await fetchWalletSigninRequest({ credential: JSON.stringify(authResponse) })
      if (signInResp?.walletAddress) {
        return signInResp.walletAddress as `0x${string}`
      }
    }
    return undefined
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'embeddedWallet.ts',
        function: 'signInWithPasskey',
      },
    })
    return undefined
  }
}

export async function signMessagesWithPasskey(messages: string[]): Promise<string[] | undefined> {
  try {
    const credential = await authenticateWithPasskey(Action.SIGN_MESSAGES)
    const signedMessagesResp = await fetchSignMessagesRequest({ messages, credential: JSON.stringify(credential) })
    return signedMessagesResp.signedMessages
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'embeddedWallet.ts',
        function: 'signMessagesWithPasskey',
      },
    })
    return undefined
  }
}

export async function signTransactionWithPasskey(transactions: string[]): Promise<string[] | undefined> {
  try {
    const credential = await authenticateWithPasskey(Action.SIGN_TRANSACTIONS)
    const signedTransactionResp = await fetchSignTransactionRequest({
      transactions,
      credential: JSON.stringify(credential),
    })
    return signedTransactionResp.signedTransactions
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'embeddedWallet.ts',
        function: 'signTransactionWithPasskey',
      },
    })
    return undefined
  }
}

export async function signTypedDataWithPasskey(typedDataBatch: string[]): Promise<string[] | undefined> {
  try {
    const credential = await authenticateWithPasskey(Action.SIGN_TYPED_DATA_BATCH)
    const signedTypedDataResp = await fetchSignTypedDataRequest({
      typedDataBatch,
      credential: JSON.stringify(credential),
    })
    return signedTypedDataResp.signature
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'embeddedWallet.ts',
        function: 'signTypedDataWithPasskey',
      },
    })
    return undefined
  }
}

export async function exportSeedPhraseWithPasskey(): Promise<string[] | undefined> {
  try {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]), // 65537
        hash: 'SHA-256',
      },
      true, // extractable
      ['encrypt', 'decrypt'],
    )
    // Export the public key in 'spki' format to match BE expectations
    const publicKeySpki = await window.crypto.subtle.exportKey('spki', keyPair.publicKey)
    const publicKeyBase64 = Buffer.from(publicKeySpki).toString('base64')
    const credential = await authenticateWithPasskey(Action.EXPORT_SEED_PHRASE)
    const seedPhraseResp = await fetchExportSeedPhraseRequest({
      encryptionKey: publicKeyBase64,
      credential: JSON.stringify(credential),
    })
    // decrypt the seed phrase
    const seedPhrase = await window.crypto.subtle.decrypt(
      {
        name: 'RSA-OAEP',
      },
      keyPair.privateKey,
      Buffer.from(seedPhraseResp.encryptedSeedPhrase, 'base64'),
    )
    return new TextDecoder().decode(seedPhrase).split(' ')
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'embeddedWallet.ts',
        function: 'exportSeedPhraseWithPasskey',
      },
    })
    return undefined
  }
}

export async function disconnectWallet(): Promise<void> {
  logger.debug('embeddedWallet.ts', 'disconnectWallet', 'Attempting to disconnect wallet')
  try {
    await fetchDisconnectRequest()
    logger.debug('embeddedWallet.ts', 'disconnectWallet', 'Wallet disconnected')
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'embeddedWallet.ts',
        function: 'disconnectWallet',
      },
    })
  }
}

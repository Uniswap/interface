import { createPromiseClient, StreamResponse, UnaryResponse } from '@connectrpc/connect'
import { createConnectTransport } from '@connectrpc/connect-web'
import { EmbeddedWalletService } from '@uniswap/client-embeddedwallet/dist/uniswap/embeddedwallet/v1/service_connect'
import {
  Action,
  AuthenticationTypes,
  ChallengeResponse,
  CreateWalletResponse,
  DeleteAuthenticatorResponse,
  DisconnectWalletResponse,
  ExportSeedPhraseResponse,
  ListAuthenticatorsResponse,
  RegisterNewAuthenticatorResponse,
  RegistrationOptions,
  SecuredChallengeResponse,
  SignMessagesResponse,
  SignTransactionsResponse,
  SignTypedDataBatchResponse,
  WalletSigninResponse,
} from '@uniswap/client-embeddedwallet/dist/uniswap/embeddedwallet/v1/service_pb'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { getVersionHeader } from 'uniswap/src/data/constants'
import { isBetaEnv, isProdEnv } from 'utilities/src/environment/env'
import { isExtensionApp, isMobileApp } from 'utilities/src/platform'
import { REQUEST_SOURCE } from 'utilities/src/platform/requestSource'

const isWalletBeta = (isExtensionApp || isMobileApp) && isBetaEnv()

const enclaveTransport = createConnectTransport({
  baseUrl: isProdEnv() || isWalletBeta ? uniswapUrls.evervaultProductionUrl : uniswapUrls.evervaultStagingUrl,
  credentials: 'include',
  interceptors: [
    (next) =>
      (request): Promise<UnaryResponse | StreamResponse> => {
        if (isMobileApp) {
          request.header.set('Origin', uniswapUrls.requestOriginUrl)
        }
        request.header.set('x-request-source', REQUEST_SOURCE)
        request.header.set('x-app-version', getVersionHeader())
        return next(request)
      },
  ],
})
export const EMBEDDED_WALLET_CLIENT = createPromiseClient(EmbeddedWalletService, enclaveTransport)

/* DATA FETCHING FUNCTIONS */
export async function fetchChallengeRequest({
  type,
  action,
  options,
}: {
  type: AuthenticationTypes
  action: Action
  options?: RegistrationOptions
}): Promise<ChallengeResponse> {
  return await EMBEDDED_WALLET_CLIENT.challenge({ type, action, options })
}

export async function fetchSecuredChallengeRequest({
  type,
  action,
  b64EncryptionPublicKey,
}: {
  type: AuthenticationTypes
  action: Action
  b64EncryptionPublicKey: string
}): Promise<SecuredChallengeResponse> {
  return await EMBEDDED_WALLET_CLIENT.securedChallenge({ type, action, b64EncryptionPublicKey })
}

export async function fetchCreateWalletRequest({ credential }: { credential: string }): Promise<CreateWalletResponse> {
  return await EMBEDDED_WALLET_CLIENT.createWallet({ credential })
}

export async function fetchWalletSigninRequest({ credential }: { credential: string }): Promise<WalletSigninResponse> {
  return await EMBEDDED_WALLET_CLIENT.walletSignin({ credential })
}

export async function fetchSignMessagesRequest({
  messages,
  credential,
}: {
  messages: string[]
  credential: string | undefined
}): Promise<SignMessagesResponse> {
  return await EMBEDDED_WALLET_CLIENT.signMessages({ messages, credential })
}

export async function fetchSignTransactionsRequest({
  transactions,
  credential,
}: {
  transactions: string[]
  credential: string | undefined
}): Promise<SignTransactionsResponse> {
  return await EMBEDDED_WALLET_CLIENT.signTransactions({ transactions, credential })
}

export async function fetchSignTypedDataRequest({
  typedDataBatch,
  credential,
}: {
  typedDataBatch: string[]
  credential: string | undefined
}): Promise<SignTypedDataBatchResponse> {
  return await EMBEDDED_WALLET_CLIENT.signTypedDataBatch({ typedDataBatch, credential })
}

export async function fetchExportSeedPhraseRequest({
  encryptionKey,
  credential,
}: {
  encryptionKey: string
  credential: string
}): Promise<ExportSeedPhraseResponse> {
  return await EMBEDDED_WALLET_CLIENT.exportSeedPhrase({ credential, b64EncryptionPublicKey: encryptionKey })
}

export async function fetchDisconnectRequest(): Promise<DisconnectWalletResponse> {
  return await EMBEDDED_WALLET_CLIENT.disconnectWallet({})
}

export async function fetchListAuthenticatorsRequest({
  credential,
}: {
  credential?: string
}): Promise<ListAuthenticatorsResponse> {
  return await EMBEDDED_WALLET_CLIENT.listAuthenticators({ credential })
}

export async function fetchRegisterNewAuthenticatorRequest({
  newCredential,
  newAuthenticationType,
  existingCredential,
  existingAuthenticationType,
}: {
  newCredential: string
  newAuthenticationType: AuthenticationTypes
  existingCredential: string
  existingAuthenticationType: AuthenticationTypes
}): Promise<RegisterNewAuthenticatorResponse> {
  return await EMBEDDED_WALLET_CLIENT.registerNewAuthenticator({
    newCredential,
    newAuthenticationType,
    existingCredential,
    existingAuthenticationType,
  })
}

export async function fetchDeleteAuthenticatorRequest({
  credential,
  authenticationType,
  authenticatorId,
  authenticatorType,
}: {
  credential: string
  authenticationType: AuthenticationTypes
  authenticatorId: string
  authenticatorType: string
}): Promise<DeleteAuthenticatorResponse> {
  return await EMBEDDED_WALLET_CLIENT.deleteAuthenticator({
    credential,
    type: authenticationType,
    authenticatorId,
    authenticatorType,
  })
}

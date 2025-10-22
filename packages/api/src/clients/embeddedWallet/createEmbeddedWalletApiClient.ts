import { type PromiseClient } from '@connectrpc/connect'
import { type EmbeddedWalletService } from '@uniswap/client-embeddedwallet/dist/uniswap/embeddedwallet/v1/service_connect'
import {
  type Action,
  type AuthenticationTypes,
  type ChallengeResponse,
  type CreateWalletResponse,
  type DeleteAuthenticatorResponse,
  type DisconnectWalletResponse,
  type ExportSeedPhraseResponse,
  type ListAuthenticatorsResponse,
  type RegisterNewAuthenticatorResponse,
  type RegistrationOptions,
  type SecuredChallengeResponse,
  type SignMessagesResponse,
  type SignTransactionsResponse,
  type SignTypedDataBatchResponse,
  type WalletSigninResponse,
} from '@uniswap/client-embeddedwallet/dist/uniswap/embeddedwallet/v1/service_pb'

export interface EmbeddedWalletClientContext {
  rpcClient: PromiseClient<typeof EmbeddedWalletService>
}

export interface EmbeddedWalletApiClient {
  fetchChallengeRequest: (params: {
    type: AuthenticationTypes
    action: Action
    options?: RegistrationOptions
  }) => Promise<ChallengeResponse>
  fetchSecuredChallengeRequest: (params: {
    type: AuthenticationTypes
    action: Action
    b64EncryptionPublicKey: string
  }) => Promise<SecuredChallengeResponse>
  fetchCreateWalletRequest: (params: { credential: string }) => Promise<CreateWalletResponse>
  fetchWalletSigninRequest: (params: { credential: string }) => Promise<WalletSigninResponse>
  fetchSignMessagesRequest: (params: {
    messages: string[]
    credential: string | undefined
  }) => Promise<SignMessagesResponse>
  fetchSignTransactionsRequest: (params: {
    transactions: string[]
    credential: string | undefined
  }) => Promise<SignTransactionsResponse>
  fetchSignTypedDataRequest: (params: {
    typedDataBatch: string[]
    credential: string | undefined
  }) => Promise<SignTypedDataBatchResponse>
  fetchExportSeedPhraseRequest: (params: {
    encryptionKey: string
    credential: string
  }) => Promise<ExportSeedPhraseResponse>
  fetchDisconnectRequest: () => Promise<DisconnectWalletResponse>
  fetchListAuthenticatorsRequest: (params: { credential?: string }) => Promise<ListAuthenticatorsResponse>
  fetchRegisterNewAuthenticatorRequest: (params: {
    newCredential: string
    newAuthenticationType: AuthenticationTypes
    existingCredential: string
    existingAuthenticationType: AuthenticationTypes
  }) => Promise<RegisterNewAuthenticatorResponse>
  fetchDeleteAuthenticatorRequest: (params: {
    credential: string
    authenticationType: AuthenticationTypes
    authenticatorId: string
    authenticatorType: string
  }) => Promise<DeleteAuthenticatorResponse>
}

export function createEmbeddedWalletApiClient({ rpcClient }: EmbeddedWalletClientContext): EmbeddedWalletApiClient {
  async function fetchChallengeRequest({
    type,
    action,
    options,
  }: {
    type: AuthenticationTypes
    action: Action
    options?: RegistrationOptions
  }): Promise<ChallengeResponse> {
    return await rpcClient.challenge({ type, action, options })
  }

  async function fetchSecuredChallengeRequest({
    type,
    action,
    b64EncryptionPublicKey,
  }: {
    type: AuthenticationTypes
    action: Action
    b64EncryptionPublicKey: string
  }): Promise<SecuredChallengeResponse> {
    return await rpcClient.securedChallenge({ type, action, b64EncryptionPublicKey })
  }

  async function fetchCreateWalletRequest({ credential }: { credential: string }): Promise<CreateWalletResponse> {
    return await rpcClient.createWallet({ credential })
  }

  async function fetchWalletSigninRequest({ credential }: { credential: string }): Promise<WalletSigninResponse> {
    return await rpcClient.walletSignin({ credential })
  }

  async function fetchSignMessagesRequest({
    messages,
    credential,
  }: {
    messages: string[]
    credential: string | undefined
  }): Promise<SignMessagesResponse> {
    return await rpcClient.signMessages({ messages, credential })
  }

  async function fetchSignTransactionsRequest({
    transactions,
    credential,
  }: {
    transactions: string[]
    credential: string | undefined
  }): Promise<SignTransactionsResponse> {
    return await rpcClient.signTransactions({ transactions, credential })
  }

  async function fetchSignTypedDataRequest({
    typedDataBatch,
    credential,
  }: {
    typedDataBatch: string[]
    credential: string | undefined
  }): Promise<SignTypedDataBatchResponse> {
    return await rpcClient.signTypedDataBatch({ typedDataBatch, credential })
  }

  async function fetchExportSeedPhraseRequest({
    encryptionKey,
    credential,
  }: {
    encryptionKey: string
    credential: string
  }): Promise<ExportSeedPhraseResponse> {
    return await rpcClient.exportSeedPhrase({ credential, b64EncryptionPublicKey: encryptionKey })
  }

  async function fetchDisconnectRequest(): Promise<DisconnectWalletResponse> {
    return await rpcClient.disconnectWallet({})
  }

  async function fetchListAuthenticatorsRequest({
    credential,
  }: {
    credential?: string
  }): Promise<ListAuthenticatorsResponse> {
    return await rpcClient.listAuthenticators({ credential })
  }

  async function fetchRegisterNewAuthenticatorRequest({
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
    return await rpcClient.registerNewAuthenticator({
      newCredential,
      newAuthenticationType,
      existingCredential,
      existingAuthenticationType,
    })
  }

  async function fetchDeleteAuthenticatorRequest({
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
    return await rpcClient.deleteAuthenticator({
      credential,
      type: authenticationType,
      authenticatorId,
      authenticatorType,
    })
  }

  return {
    fetchChallengeRequest,
    fetchSecuredChallengeRequest,
    fetchCreateWalletRequest,
    fetchWalletSigninRequest,
    fetchSignMessagesRequest,
    fetchSignTransactionsRequest,
    fetchSignTypedDataRequest,
    fetchExportSeedPhraseRequest,
    fetchDisconnectRequest,
    fetchListAuthenticatorsRequest,
    fetchRegisterNewAuthenticatorRequest,
    fetchDeleteAuthenticatorRequest,
  }
}

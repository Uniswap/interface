import { type PromiseClient } from '@connectrpc/connect'
import { EmbeddedWalletService as OldEmbeddedWalletService } from '@uniswap/client-embeddedwallet/dist/uniswap/embeddedwallet/v1/service_connect'
import {
  type DeleteAuthenticatorResponse,
  type ExportSeedPhraseResponse,
  type ListAuthenticatorsResponse,
  type Action as OldAction,
  type AuthenticationTypes as OldAuthenticationTypes,
  type RegisterNewAuthenticatorResponse,
  type SecuredChallengeResponse,
} from '@uniswap/client-embeddedwallet/dist/uniswap/embeddedwallet/v1/service_pb'
import {
  type ChallengeResponse,
  type CreateWalletResponse,
  type DisconnectResponse,
  type Action as NewAction,
  type AuthenticationTypes as NewAuthenticationTypes,
  type RegistrationOptions,
  type SignMessageResponse,
  type SignTransactionResponse,
  type SignTypedDataResponse,
  type WalletSignInResponse,
} from '@uniswap/client-privy-embedded-wallet/dist/uniswap/privy-embedded-wallet/v1/service_pb'

export type {
  DeleteAuthenticatorResponse,
  ExportSeedPhraseResponse,
  ListAuthenticatorsResponse,
  RegisterNewAuthenticatorResponse,
  SecuredChallengeResponse,
} from '@uniswap/client-embeddedwallet/dist/uniswap/embeddedwallet/v1/service_pb'
export type {
  Action,
  AuthenticationTypes,
  ChallengeResponse,
  CreateWalletResponse,
  DisconnectResponse,
  RegistrationOptions,
  SignMessageResponse,
  SignTransactionResponse,
  SignTypedDataResponse,
  WalletSignInResponse,
} from '@uniswap/client-privy-embedded-wallet/dist/uniswap/privy-embedded-wallet/v1/service_pb'

export interface EmbeddedWalletClientContext {
  rpcClient: {
    challenge: (req: Record<string, unknown>) => Promise<ChallengeResponse>
    createWallet: (req: Record<string, unknown>) => Promise<CreateWalletResponse>
    walletSignIn: (req: Record<string, unknown>) => Promise<WalletSignInResponse>
    signMessage: (req: Record<string, unknown>) => Promise<SignMessageResponse>
    signTransaction: (req: Record<string, unknown>) => Promise<SignTransactionResponse>
    signTypedData: (req: Record<string, unknown>) => Promise<SignTypedDataResponse>
    disconnect: (req: Record<string, unknown>) => Promise<DisconnectResponse>
  }
  legacyRpcClient?: PromiseClient<typeof OldEmbeddedWalletService>
}

export interface EmbeddedWalletApiClient {
  fetchChallengeRequest: (params: {
    type: NewAuthenticationTypes
    action: NewAction
    options?: RegistrationOptions
    walletId?: string
    message?: string
    transaction?: string
    typedData?: string
  }) => Promise<ChallengeResponse>

  fetchCreateWalletRequest: (params: { credential: string }) => Promise<CreateWalletResponse>

  fetchWalletSigninRequest: (params: { credential: string }) => Promise<WalletSignInResponse>

  // Batch operations adapted to single operations
  fetchSignMessagesRequest: (params: {
    messages: string[]
    credential: string | undefined
  }) => Promise<{ signatures: string[] }>

  fetchSignTransactionsRequest: (params: {
    transactions: string[]
    credential: string | undefined
  }) => Promise<{ signatures: string[] }>

  fetchSignTypedDataRequest: (params: {
    typedDataBatch: string[]
    credential: string | undefined
  }) => Promise<{ signatures: string[] }>

  fetchDisconnectRequest: () => Promise<DisconnectResponse>

  fetchSecuredChallengeRequest: (params: {
    type: OldAuthenticationTypes
    action: OldAction
    b64EncryptionPublicKey: string
  }) => Promise<SecuredChallengeResponse>

  fetchExportSeedPhraseRequest: (params: {
    encryptionKey: string
    credential: string
  }) => Promise<ExportSeedPhraseResponse>

  fetchListAuthenticatorsRequest: (params: { credential?: string }) => Promise<ListAuthenticatorsResponse>

  fetchRegisterNewAuthenticatorRequest: (params: {
    newCredential: string
    newAuthenticationType: OldAuthenticationTypes
    existingCredential: string
    existingAuthenticationType: OldAuthenticationTypes
  }) => Promise<RegisterNewAuthenticatorResponse>

  fetchDeleteAuthenticatorRequest: (params: {
    credential: string
    authenticationType: OldAuthenticationTypes
    authenticatorId: string
    authenticatorType: string
  }) => Promise<DeleteAuthenticatorResponse>
}

export function createEmbeddedWalletApiClient({
  rpcClient,
  legacyRpcClient,
}: EmbeddedWalletClientContext): EmbeddedWalletApiClient {
  async function fetchChallengeRequest({
    type,
    action,
    options,
    walletId,
    message,
    transaction,
    typedData,
  }: {
    type: NewAuthenticationTypes
    action: NewAction
    options?: RegistrationOptions
    walletId?: string
    message?: string
    transaction?: string
    typedData?: string
  }): Promise<ChallengeResponse> {
    return await rpcClient.challenge({
      type,
      action,
      options,
      walletId,
      message,
      transaction,
      typedData,
    })
  }

  async function fetchCreateWalletRequest({ credential }: { credential: string }): Promise<CreateWalletResponse> {
    return await rpcClient.createWallet({ credential })
  }

  async function fetchWalletSigninRequest({ credential }: { credential: string }): Promise<WalletSignInResponse> {
    return await rpcClient.walletSignIn({ credential })
  }

  async function fetchSignMessagesRequest({
    messages,
    credential,
  }: {
    messages: string[]
    credential: string | undefined
  }): Promise<{ signatures: string[] }> {
    if (messages.length === 0) {
      throw new Error('At least one message required')
    }
    if (messages.length > 1) {
      throw new Error('Batch message signing not yet supported - use single message')
    }
    const result = await rpcClient.signMessage({
      message: messages[0],
      credential: credential ?? '',
    })
    return { signatures: [result.signature] }
  }

  async function fetchSignTransactionsRequest({
    transactions,
    credential,
  }: {
    transactions: string[]
    credential: string | undefined
  }): Promise<{ signatures: string[] }> {
    if (transactions.length === 0) {
      throw new Error('At least one transaction required')
    }
    if (transactions.length > 1) {
      throw new Error('Batch transaction signing not yet supported - use single transaction')
    }
    const result = await rpcClient.signTransaction({
      transaction: transactions[0],
      credential: credential ?? '',
    })
    return { signatures: [result.signature] }
  }

  async function fetchSignTypedDataRequest({
    typedDataBatch,
    credential,
  }: {
    typedDataBatch: string[]
    credential: string | undefined
  }): Promise<{ signatures: string[] }> {
    if (typedDataBatch.length === 0) {
      throw new Error('At least one typed data required')
    }
    if (typedDataBatch.length > 1) {
      throw new Error('Batch typed data signing not yet supported - use single typed data')
    }
    const result = await rpcClient.signTypedData({
      typedData: typedDataBatch[0],
      credential: credential ?? '',
    })
    return { signatures: [result.signature] }
  }

  async function fetchDisconnectRequest(): Promise<DisconnectResponse> {
    return await rpcClient.disconnect({})
  }

  async function fetchSecuredChallengeRequest({
    type,
    action,
    b64EncryptionPublicKey,
  }: {
    type: OldAuthenticationTypes
    action: OldAction
    b64EncryptionPublicKey: string
    walletId?: string
  }): Promise<SecuredChallengeResponse> {
    if (!legacyRpcClient) {
      throw new Error('SecuredChallenge not supported in new API - legacy client required')
    }
    return await legacyRpcClient.securedChallenge({
      type,
      action,
      b64EncryptionPublicKey,
    })
  }

  async function fetchExportSeedPhraseRequest({
    encryptionKey,
    credential,
  }: {
    encryptionKey: string
    credential: string
  }): Promise<ExportSeedPhraseResponse> {
    if (!legacyRpcClient) {
      throw new Error('ExportSeedPhrase not supported in new API - legacy client required')
    }
    return await legacyRpcClient.exportSeedPhrase({ credential, b64EncryptionPublicKey: encryptionKey })
  }

  async function fetchListAuthenticatorsRequest({
    credential,
  }: {
    credential?: string
  }): Promise<ListAuthenticatorsResponse> {
    if (!legacyRpcClient) {
      throw new Error('ListAuthenticators not supported in new API - legacy client required')
    }
    return await legacyRpcClient.listAuthenticators({ credential })
  }

  async function fetchRegisterNewAuthenticatorRequest({
    newCredential,
    newAuthenticationType,
    existingCredential,
    existingAuthenticationType,
  }: {
    newCredential: string
    newAuthenticationType: OldAuthenticationTypes
    existingCredential: string
    existingAuthenticationType: OldAuthenticationTypes
  }): Promise<RegisterNewAuthenticatorResponse> {
    if (!legacyRpcClient) {
      throw new Error('RegisterNewAuthenticator not supported in new API - legacy client required')
    }
    return await legacyRpcClient.registerNewAuthenticator({
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
    authenticationType: OldAuthenticationTypes
    authenticatorId: string
    authenticatorType: string
  }): Promise<DeleteAuthenticatorResponse> {
    if (!legacyRpcClient) {
      throw new Error('DeleteAuthenticator not supported in new API - legacy client required')
    }
    return await legacyRpcClient.deleteAuthenticator({
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

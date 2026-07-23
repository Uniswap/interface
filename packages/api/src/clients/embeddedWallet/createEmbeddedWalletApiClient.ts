import {
  type Action as OldAction,
  type AuthenticationTypes as OldAuthenticationTypes,
  type SecuredChallengeResponse,
} from '@uniswap/client-embeddedwallet/dist/uniswap/embeddedwallet/v1/service_pb'
import {
  type AddAuthenticatorResponse,
  type ChallengeResponse,
  type CheckRecoveryAvailabilityResponse,
  type CreateWalletResponse,
  type DeleteAuthenticatorResponse,
  type DeleteRecoveryResponse,
  type DisconnectResponse,
  type ExecuteRecoveryResponse,
  type ExportSeedPhraseResponse,
  type GetRecoveryConfigResponse,
  type ListAuthenticatorsResponse,
  type OprfEvaluateResponse,
  type PrepareAddAuthenticatorResponse,
  type ReportDecryptionResultResponse,
  type SetupRecoveryResponse,
  type SignMessageResponse,
  type SignTransactionResponse,
  type SignTypedDataResponse,
  type StartAuthenticatedSessionResponse,
  type WalletSignInResponse,
} from '@uniswap/client-privy-embedded-wallet/dist/uniswap/privy-embedded-wallet/v1/service_pb'
import type {
  ChallengeRequestParams,
  EmbeddedWalletApiClient,
  EmbeddedWalletClientContext,
  ExportSeedPhraseParams,
  Sign7702AuthorizationParams,
  Sign7702AuthorizationResult,
  Sign7702TransactionParams,
  SignAuth,
} from '@universe/api/src/clients/embeddedWallet/createEmbeddedWalletApiClient.types'

export type {
  Action,
  AddAuthenticatorResponse,
  AuthenticationTypes,
  Authenticator,
  ChallengeResponse,
  CheckRecoveryAvailabilityResponse,
  CreateWalletResponse,
  DeleteAuthenticatorResponse,
  DeleteRecoveryResponse,
  DisconnectResponse,
  ExecuteRecoveryResponse,
  ExportSeedPhraseResponse,
  GetRecoveryConfigResponse,
  ListAuthenticatorsResponse,
  OprfEvaluateResponse,
  PrepareAddAuthenticatorResponse,
  RecoveryMethod,
  RegistrationOptions,
  ReportDecryptionResultResponse,
  SetupRecoveryResponse,
  Sign7702AuthorizationResponse,
  Sign7702TransactionResponse,
  SignMessageResponse,
  SignTransactionResponse,
  SignTypedDataResponse,
  StartAuthenticatedSessionResponse,
  WalletSignInResponse,
} from '@uniswap/client-privy-embedded-wallet/dist/uniswap/privy-embedded-wallet/v1/service_pb'
export type {
  ChallengeRequestParams,
  EmbeddedWalletApiClient,
  EmbeddedWalletClientContext,
  Sign7702AuthorizationParams,
  Sign7702AuthorizationResult,
  Sign7702TransactionParams,
  SignAuth,
} from '@universe/api/src/clients/embeddedWallet/createEmbeddedWalletApiClient.types'

export function createEmbeddedWalletApiClient({
  rpcClient,
  legacyRpcClient,
}: EmbeddedWalletClientContext): EmbeddedWalletApiClient {
  const inflightRequests = new Map<string, Promise<unknown>>()

  function requireSingle<T>(items: T[], label: string): T {
    const [first] = items
    if (first === undefined) {
      throw new Error(`At least one ${label} required`)
    }
    if (items.length > 1) {
      throw new Error(`Batch ${label} signing not yet supported - use single ${label}`)
    }
    return first
  }

  async function fetchChallengeRequest(params: ChallengeRequestParams): Promise<ChallengeResponse> {
    const { type, action, walletId, message, transaction, typedData, authenticatorId, devicePublicKey } = params
    const cacheKey = `challenge:${type}:${action}:${walletId ?? 'no-wallet'}:${message ?? ''}:${transaction ?? ''}:${typedData ?? ''}:${authenticatorId ?? ''}:${devicePublicKey ?? ''}:${params.encryptionKey ?? ''}:${params.authorizationContractAddress ?? ''}:${params.authorizationChainId ?? ''}:${params.authorizationNonce ?? ''}`

    const existingRequest = inflightRequests.get(cacheKey) as Promise<ChallengeResponse> | undefined
    if (existingRequest) {
      return existingRequest
    }

    const request = rpcClient
      .challenge({
        ...params,
        authorizationChainId: params.authorizationChainId ? BigInt(params.authorizationChainId) : undefined,
        authorizationNonce: params.authorizationNonce ? BigInt(params.authorizationNonce) : undefined,
      })
      .finally(() => {
        inflightRequests.delete(cacheKey)
      })

    inflightRequests.set(cacheKey, request)
    return request
  }

  async function fetchCreateWalletRequest({
    credential,
    devicePublicKey,
  }: {
    credential: string
    devicePublicKey: string
  }): Promise<CreateWalletResponse> {
    return await rpcClient.createWallet({ credential, devicePublicKey })
  }

  async function fetchWalletSigninRequest({ credential }: { credential: string }): Promise<WalletSignInResponse> {
    return await rpcClient.walletSignIn({ credential })
  }

  async function fetchSignMessagesRequest({
    messages,
    auth,
  }: {
    messages: string[]
    auth: SignAuth
  }): Promise<{ signatures: string[] }> {
    const message = requireSingle(messages, 'message')
    const result = await rpcClient.signMessage({ message, auth })
    return { signatures: [result.signature] }
  }

  async function fetchSignTransactionsRequest({
    transactions,
    auth,
  }: {
    transactions: string[]
    auth: SignAuth
  }): Promise<{ signatures: string[] }> {
    const transaction = requireSingle(transactions, 'transaction')
    const result = await rpcClient.signTransaction({ transaction, auth })
    return { signatures: [result.signature] }
  }

  async function fetchSignTypedDataRequest({
    typedDataBatch,
    auth,
  }: {
    typedDataBatch: string[]
    auth: SignAuth
  }): Promise<{ signatures: string[] }> {
    const typedData = requireSingle(typedDataBatch, 'typed data')
    const result = await rpcClient.signTypedData({ typedData, auth })
    return { signatures: [result.signature] }
  }

  async function fetchDisconnectRequest(params?: {
    deviceAuth?: { deviceSignature: string; walletId: string; signingPayload?: string }
  }): Promise<DisconnectResponse> {
    // DisconnectRequest has `device_auth` as a top-level optional field (not a oneof).
    return await rpcClient.disconnect(params?.deviceAuth ? { deviceAuth: params.deviceAuth } : {})
  }

  async function fetchListAuthenticatorsRequest({
    credential,
    deviceAuth,
  }: {
    credential?: string
    deviceAuth?: { deviceSignature: string; walletId: string; signingPayload?: string }
  }): Promise<ListAuthenticatorsResponse> {
    const cacheKey = `listAuthenticators:${credential ?? deviceAuth?.walletId ?? 'no-key'}`

    const existingRequest = inflightRequests.get(cacheKey) as Promise<ListAuthenticatorsResponse> | undefined
    if (existingRequest) {
      return existingRequest
    }

    // ListAuthenticatorsRequest has `credential` and `device_auth` as separate top-level
    // optional fields (not a oneof) — send whichever is present directly.
    const request = rpcClient.listAuthenticators({ credential, deviceAuth }).finally(() => {
      inflightRequests.delete(cacheKey)
    })

    inflightRequests.set(cacheKey, request)
    return request
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
    return await legacyRpcClient.securedChallenge({ type, action, b64EncryptionPublicKey })
  }

  const fetchExportSeedPhraseRequest = (params: ExportSeedPhraseParams): Promise<ExportSeedPhraseResponse> =>
    rpcClient.exportSeedPhrase(params)

  const fetchExportEncryptedSeedPhraseRequest = (params: ExportSeedPhraseParams): Promise<ExportSeedPhraseResponse> =>
    rpcClient.exportSeedPhrase(params)

  async function fetchStartAuthenticatedSessionRequest({
    existingCredential,
    devicePublicKey,
  }: {
    existingCredential: string
    devicePublicKey: string
  }): Promise<StartAuthenticatedSessionResponse> {
    return await rpcClient.startAuthenticatedSession({ existingCredential, devicePublicKey })
  }

  async function fetchPrepareAddAuthenticatorRequest({
    newCredential,
  }: {
    newCredential: string
  }): Promise<PrepareAddAuthenticatorResponse> {
    return await rpcClient.prepareAddAuthenticator({ newCredential })
  }

  async function fetchAddAuthenticatorRequest({
    newCredential,
    deviceSignature,
  }: {
    newCredential?: string
    deviceSignature: string
  }): Promise<AddAuthenticatorResponse> {
    return await rpcClient.addAuthenticator({ newCredential, deviceSignature })
  }

  async function fetchDeleteAuthenticatorRequest({
    credential,
    authenticatorId,
  }: {
    credential: string
    authenticatorId: string
  }): Promise<DeleteAuthenticatorResponse> {
    return await rpcClient.deleteAuthenticator({ credential, authenticatorId })
  }

  async function fetchOprfEvaluate(
    params: {
      blindedElement: string
      authMethodId: string
      rotate?: boolean
    },
    accessToken: string,
  ): Promise<OprfEvaluateResponse> {
    return await rpcClient.oprfEvaluate(params, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  }

  async function fetchCheckRecoveryAvailability(
    params: { authMethodId: string },
    accessToken: string,
  ): Promise<CheckRecoveryAvailabilityResponse> {
    return await rpcClient.checkRecoveryAvailability(params, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  }

  async function fetchSetupRecovery(params: {
    credential?: string
    authMethodId: string
    authMethodType?: string
    encryptedKeyId?: string
    authMethodIdentifier?: string
    authKeySignature?: string
    recoveryAuthSignature?: string
    signingPayload?: string
  }): Promise<SetupRecoveryResponse> {
    return await rpcClient.setupRecovery(params)
  }

  async function fetchExecuteRecovery(params: {
    authMethodId: string
    newCredential: string
    authKeySignature: string
    recoveryAuthSignature: string
  }): Promise<ExecuteRecoveryResponse> {
    return await rpcClient.executeRecovery(params)
  }

  const fetchReportDecryptionResult = (
    params: {
      success: boolean
      authMethodId: string
      newPasskeyPublicKey?: string
      encryptionKey?: string
    },
    accessToken: string,
  ): Promise<ReportDecryptionResultResponse> =>
    rpcClient.reportDecryptionResult(params, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

  const fetchExportSeedPhraseWithRecovery = (params: {
    authMethodId: string
    encryptionKey: string
    authKeySignature: string
    recoveryAuthSignature: string
  }): Promise<ExportSeedPhraseResponse> => rpcClient.exportSeedPhraseWithRecovery(params)

  async function fetchGetRecoveryConfig(
    params: { authMethodId: string },
    accessToken: string,
  ): Promise<GetRecoveryConfigResponse> {
    return await rpcClient.getRecoveryConfig(params, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  }

  async function fetchDeleteRecovery({ credential }: { credential: string }): Promise<DeleteRecoveryResponse> {
    return await rpcClient.deleteRecovery({ credential })
  }

  async function fetchSign7702AuthorizationRequest(
    params: Sign7702AuthorizationParams,
  ): Promise<Sign7702AuthorizationResult> {
    const { contractAddress, chainId, nonce, auth } = params
    const result = await rpcClient.sign7702Authorization({
      contractAddress,
      chainId: BigInt(chainId),
      nonce: BigInt(nonce),
      auth,
    })
    return {
      contractAddress: result.contractAddress || contractAddress,
      chainId: Number(result.chainId),
      nonce: Number(result.nonce),
      r: result.r,
      s: result.s,
      yParity: Number(result.yParity),
    }
  }

  async function fetchSign7702TransactionRequest(
    params: Sign7702TransactionParams,
  ): Promise<{ signedTransaction: string }> {
    const result = await rpcClient.sign7702Transaction({
      ...params,
      chainId: BigInt(params.chainId),
      nonce: BigInt(params.nonce),
      authorizationChainId: BigInt(params.authorizationChainId),
      authorizationNonce: BigInt(params.authorizationNonce),
    })
    if (!result.signedTransaction) {
      throw new Error('No signed transaction returned from backend')
    }
    return { signedTransaction: result.signedTransaction }
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
    fetchExportEncryptedSeedPhraseRequest,
    fetchDisconnectRequest,
    fetchListAuthenticatorsRequest,
    fetchStartAuthenticatedSessionRequest,
    fetchPrepareAddAuthenticatorRequest,
    fetchAddAuthenticatorRequest,
    fetchDeleteAuthenticatorRequest,
    fetchOprfEvaluate,
    fetchCheckRecoveryAvailability,
    fetchSetupRecovery,
    fetchExecuteRecovery,
    fetchReportDecryptionResult,
    fetchExportSeedPhraseWithRecovery,
    fetchGetRecoveryConfig,
    fetchDeleteRecovery,
    fetchSign7702AuthorizationRequest,
    fetchSign7702TransactionRequest,
  }
}

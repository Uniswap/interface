import { type CallOptions, type PromiseClient } from '@connectrpc/connect'
import { EmbeddedWalletService as OldEmbeddedWalletService } from '@uniswap/client-embeddedwallet/dist/uniswap/embeddedwallet/v1/service_connect'
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
  type Action as NewAction,
  type AuthenticationTypes as NewAuthenticationTypes,
  type OprfEvaluateResponse,
  type PrepareAddAuthenticatorResponse,
  type RegistrationOptions,
  type ReportDecryptionResultResponse,
  type SetupRecoveryResponse,
  type Sign7702AuthorizationResponse,
  type Sign7702TransactionResponse,
  type SignMessageResponse,
  type SignTransactionResponse,
  type SignTypedDataResponse,
  type StartAuthenticatedSessionResponse,
  type WalletSignInResponse,
} from '@uniswap/client-privy-embedded-wallet/dist/uniswap/privy-embedded-wallet/v1/service_pb'

export type SignAuth =
  | { case: 'credential'; value: string }
  | { case: 'deviceAuth'; value: { deviceSignature: string; walletId: string; signingPayload: string } }
  | { case: undefined; value?: undefined }

export interface EmbeddedWalletClientContext {
  rpcClient: {
    challenge: (req: Record<string, unknown>) => Promise<ChallengeResponse>
    createWallet: (req: Record<string, unknown>) => Promise<CreateWalletResponse>
    walletSignIn: (req: Record<string, unknown>) => Promise<WalletSignInResponse>
    signMessage: (req: Record<string, unknown>) => Promise<SignMessageResponse>
    signTransaction: (req: Record<string, unknown>) => Promise<SignTransactionResponse>
    signTypedData: (req: Record<string, unknown>) => Promise<SignTypedDataResponse>
    disconnect: (req: Record<string, unknown>) => Promise<DisconnectResponse>
    listAuthenticators: (req: Record<string, unknown>) => Promise<ListAuthenticatorsResponse>
    startAuthenticatedSession: (req: Record<string, unknown>) => Promise<StartAuthenticatedSessionResponse>
    prepareAddAuthenticator: (req: Record<string, unknown>) => Promise<PrepareAddAuthenticatorResponse>
    addAuthenticator: (req: Record<string, unknown>) => Promise<AddAuthenticatorResponse>
    deleteAuthenticator: (req: Record<string, unknown>) => Promise<DeleteAuthenticatorResponse>
    oprfEvaluate: (req: Record<string, unknown>, options?: CallOptions) => Promise<OprfEvaluateResponse>
    checkRecoveryAvailability: (
      req: Record<string, unknown>,
      options?: CallOptions,
    ) => Promise<CheckRecoveryAvailabilityResponse>
    setupRecovery: (req: Record<string, unknown>) => Promise<SetupRecoveryResponse>
    executeRecovery: (req: Record<string, unknown>) => Promise<ExecuteRecoveryResponse>
    reportDecryptionResult: (
      req: Record<string, unknown>,
      options?: CallOptions,
    ) => Promise<ReportDecryptionResultResponse>
    getRecoveryConfig: (req: Record<string, unknown>, options?: CallOptions) => Promise<GetRecoveryConfigResponse>
    deleteRecovery: (req: Record<string, unknown>) => Promise<DeleteRecoveryResponse>
    sign7702Authorization: (req: Record<string, unknown>) => Promise<Sign7702AuthorizationResponse>
    sign7702Transaction: (req: Record<string, unknown>) => Promise<Sign7702TransactionResponse>
    exportSeedPhrase: (req: Record<string, unknown>) => Promise<ExportSeedPhraseResponse>
    exportSeedPhraseWithRecovery: (req: Record<string, unknown>) => Promise<ExportSeedPhraseResponse>
  }
  legacyRpcClient?: PromiseClient<typeof OldEmbeddedWalletService>
}

export type ChallengeRequestParams = {
  type: NewAuthenticationTypes
  action: NewAction
  options?: RegistrationOptions
  walletId?: string
  message?: string
  transaction?: string
  typedData?: string
  authenticatorId?: string
  devicePublicKey?: string
  authPublicKey?: string
  privyUserId?: string
  encryptionKey?: string
  authorizationContractAddress?: string
  authorizationChainId?: string
  authorizationNonce?: string
}

export type ExportSeedPhraseParams = { encryptionKey: string; credential: string }

export type Sign7702AuthorizationParams = {
  contractAddress: string
  chainId: number
  nonce: number
  auth: SignAuth
}
export type Sign7702AuthorizationResult = {
  contractAddress: string
  chainId: number
  nonce: number
  r: string
  s: string
  yParity: number
}
export type Sign7702TransactionParams = {
  to: string
  data: string
  value: string
  chainId: number
  gas: string
  maxFeePerGas: string
  maxPriorityFeePerGas: string
  nonce: number
  authorizationContractAddress: string
  authorizationChainId: number
  authorizationNonce: number
  authorizationR: string
  authorizationS: string
  authorizationYParity: number
  auth: SignAuth
}

export interface EmbeddedWalletApiClient {
  fetchChallengeRequest: (params: ChallengeRequestParams) => Promise<ChallengeResponse>
  fetchCreateWalletRequest: (params: { credential: string; devicePublicKey: string }) => Promise<CreateWalletResponse>
  fetchWalletSigninRequest: (params: { credential: string }) => Promise<WalletSignInResponse>
  fetchSignMessagesRequest: (params: { messages: string[]; auth: SignAuth }) => Promise<{ signatures: string[] }>
  fetchSignTransactionsRequest: (params: {
    transactions: string[]
    auth: SignAuth
  }) => Promise<{ signatures: string[] }>
  fetchSignTypedDataRequest: (params: { typedDataBatch: string[]; auth: SignAuth }) => Promise<{ signatures: string[] }>
  fetchDisconnectRequest: (params?: {
    deviceAuth?: { deviceSignature: string; walletId: string; signingPayload?: string }
  }) => Promise<DisconnectResponse>
  fetchListAuthenticatorsRequest: (params: {
    credential?: string
    deviceAuth?: { deviceSignature: string; walletId: string; signingPayload?: string }
  }) => Promise<ListAuthenticatorsResponse>
  fetchSecuredChallengeRequest: (params: {
    type: OldAuthenticationTypes
    action: OldAction
    b64EncryptionPublicKey: string
  }) => Promise<SecuredChallengeResponse>
  fetchExportSeedPhraseRequest: (params: ExportSeedPhraseParams) => Promise<ExportSeedPhraseResponse>
  fetchExportEncryptedSeedPhraseRequest: (params: ExportSeedPhraseParams) => Promise<ExportSeedPhraseResponse>
  fetchStartAuthenticatedSessionRequest: (params: {
    existingCredential: string
    devicePublicKey: string
  }) => Promise<StartAuthenticatedSessionResponse>
  fetchPrepareAddAuthenticatorRequest: (params: { newCredential: string }) => Promise<PrepareAddAuthenticatorResponse>
  fetchAddAuthenticatorRequest: (params: {
    newCredential?: string
    deviceSignature: string
  }) => Promise<AddAuthenticatorResponse>
  fetchDeleteAuthenticatorRequest: (params: {
    credential: string
    authenticatorId: string
  }) => Promise<DeleteAuthenticatorResponse>
  fetchOprfEvaluate: (
    params: {
      blindedElement: string
      authMethodId: string
      // Rotation: force a v2 setup-style eval with a fresh nonce even though a v1 config exists.
      rotate?: boolean
    },
    accessToken: string,
  ) => Promise<OprfEvaluateResponse>
  fetchCheckRecoveryAvailability: (
    params: { authMethodId: string },
    accessToken: string,
  ) => Promise<CheckRecoveryAvailabilityResponse>
  // Two auth modes: passkey (`credential`) or passkey-less recovery-auth
  // (`authKeySignature` + `recoveryAuthSignature` + `signingPayload`) for v1→v2 rotation.
  fetchSetupRecovery: (params: {
    credential?: string
    authMethodId: string
    authMethodType?: string
    encryptedKeyId?: string
    authMethodIdentifier?: string
    authKeySignature?: string
    recoveryAuthSignature?: string
    signingPayload?: string
  }) => Promise<SetupRecoveryResponse>
  fetchExecuteRecovery: (params: {
    authMethodId: string
    newCredential: string
    authKeySignature: string
    recoveryAuthSignature: string
  }) => Promise<ExecuteRecoveryResponse>
  fetchReportDecryptionResult: (
    params: {
      success: boolean
      authMethodId: string
      newPasskeyPublicKey?: string
      // Ephemeral HPKE SPKI (base64) for the recovery-based export flow. Server uses it to
      // generate an export signing payload instead of a passkey-registration payload.
      encryptionKey?: string
    },
    accessToken: string,
  ) => Promise<ReportDecryptionResultResponse>
  fetchGetRecoveryConfig: (params: { authMethodId: string }, accessToken: string) => Promise<GetRecoveryConfigResponse>
  fetchDeleteRecovery: (params: { credential: string }) => Promise<DeleteRecoveryResponse>
  fetchExportSeedPhraseWithRecovery: (params: {
    authMethodId: string
    encryptionKey: string
    authKeySignature: string
    recoveryAuthSignature: string
  }) => Promise<ExportSeedPhraseResponse>
  fetchSign7702AuthorizationRequest: (params: Sign7702AuthorizationParams) => Promise<Sign7702AuthorizationResult>
  fetchSign7702TransactionRequest: (params: Sign7702TransactionParams) => Promise<{ signedTransaction: string }>
}

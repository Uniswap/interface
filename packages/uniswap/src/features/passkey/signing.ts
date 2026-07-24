import {
  Action,
  AuthenticationTypes,
} from '@uniswap/client-privy-embedded-wallet/dist/uniswap/privy-embedded-wallet/v1/service_pb'
import type { Sign7702AuthorizationResult, SignAuth } from '@universe/api'
import { SharedQueryClient } from '@universe/api'
import { EmbeddedWalletApiClient } from 'uniswap/src/data/rest/embeddedWallet/requests'
import { ensureNeckKeyPair, loadNeckMetadata, signWithDeviceKey } from 'uniswap/src/features/passkey/deviceSession'
import { authenticatePasskey } from 'uniswap/src/features/passkey/passkey'
import { refreshNeckSession } from 'uniswap/src/features/passkey/passkeySession'
import { logger } from 'utilities/src/logger/logger'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

async function signWithDeviceSessionOrPasskey<T>({
  action,
  walletId,
  challengeParams,
  signRequest,
}: {
  action: Action
  walletId?: string
  challengeParams: Record<string, string>
  signRequest: (auth: SignAuth) => Promise<T>
}): Promise<T> {
  const neckMeta = loadNeckMetadata()
  const resolvedWalletId = walletId ?? neckMeta?.walletId
  if (!resolvedWalletId) {
    throw new Error('No walletId available for device auth')
  }

  const {
    privateKey: neckPrivateKey,
    publicKeyBase64: devicePublicKey,
    isFresh,
  } = await ensureNeckKeyPair(resolvedWalletId)

  if (isFresh) {
    await refreshNeckSession(devicePublicKey, resolvedWalletId)
  }

  const challengeBaseParams = {
    type: AuthenticationTypes.PASSKEY_AUTHENTICATION,
    action,
    walletId: resolvedWalletId,
    devicePublicKey,
    ...challengeParams,
  }

  let challenge = await EmbeddedWalletApiClient.fetchChallengeRequest(challengeBaseParams)
  SharedQueryClient.setQueryData([ReactQueryCacheKey.PasskeyAuthStatus, true], challenge.sessionActive)

  if (!challenge.sessionActive) {
    await refreshNeckSession(devicePublicKey, resolvedWalletId)
    challenge = await EmbeddedWalletApiClient.fetchChallengeRequest(challengeBaseParams)
    SharedQueryClient.setQueryData([ReactQueryCacheKey.PasskeyAuthStatus, true], challenge.sessionActive)
  }

  if (!challenge.signingPayload) {
    throw new Error('Challenge did not return a signing payload')
  }

  const deviceSignature = await signWithDeviceKey(neckPrivateKey, challenge.signingPayload)
  return signRequest({
    case: 'deviceAuth',
    value: { deviceSignature, walletId: resolvedWalletId, signingPayload: challenge.signingPayload },
  })
}

export async function signMessageWithPasskey(message: string, walletId?: string): Promise<string | undefined> {
  try {
    const result = await signWithDeviceSessionOrPasskey({
      action: Action.SIGN_MESSAGE,
      walletId,
      challengeParams: { message },
      signRequest: (auth) => EmbeddedWalletApiClient.fetchSignMessagesRequest({ messages: [message], auth }),
    })
    return result.signatures[0]
  } catch (error) {
    logger.error(error, { tags: { file: 'signing.ts', function: 'signMessageWithPasskey' } })
    throw error
  }
}

export async function signTransactionWithPasskey(transaction: string, walletId?: string): Promise<string | undefined> {
  try {
    const result = await signWithDeviceSessionOrPasskey({
      action: Action.SIGN_TRANSACTION,
      walletId,
      challengeParams: { transaction },
      signRequest: (auth) =>
        EmbeddedWalletApiClient.fetchSignTransactionsRequest({ transactions: [transaction], auth }),
    })
    return result.signatures[0]
  } catch (error) {
    logger.error(error, { tags: { file: 'signing.ts', function: 'signTransactionWithPasskey' } })
    throw error
  }
}

export async function signTypedDataWithPasskey(typedData: string, walletId?: string): Promise<string | undefined> {
  try {
    const result = await signWithDeviceSessionOrPasskey({
      action: Action.SIGN_TYPED_DATA,
      walletId,
      challengeParams: { typedData },
      signRequest: (auth) => EmbeddedWalletApiClient.fetchSignTypedDataRequest({ typedDataBatch: [typedData], auth }),
    })
    return result.signatures[0]
  } catch (error) {
    logger.error(error, { tags: { file: 'signing.ts', function: 'signTypedDataWithPasskey' } })
    throw error
  }
}

export async function sign7702AuthorizationWithPasskey(params: {
  contractAddress: string
  chainId: number
  nonce: number
  walletId?: string
}): Promise<Sign7702AuthorizationResult> {
  const { contractAddress, chainId, nonce, walletId } = params
  try {
    return await signWithDeviceSessionOrPasskey({
      action: Action.SIGN_7702_AUTHORIZATION,
      walletId,
      challengeParams: {
        authorizationContractAddress: contractAddress,
        authorizationChainId: String(chainId),
        authorizationNonce: String(nonce),
      },
      signRequest: (auth) =>
        EmbeddedWalletApiClient.fetchSign7702AuthorizationRequest({ contractAddress, chainId, nonce, auth }),
    })
  } catch (error) {
    logger.error(error, { tags: { file: 'signing.ts', function: 'sign7702AuthorizationWithPasskey' } })
    throw error
  }
}

export async function sign7702TransactionWithPasskey(params: {
  to: string
  data: string
  value: string
  chainId: number
  gas: string
  maxFeePerGas: string
  maxPriorityFeePerGas: string
  nonce: number
  authorization: Sign7702AuthorizationResult
  walletId?: string
}): Promise<string> {
  const { to, data, value, chainId, gas, maxFeePerGas, maxPriorityFeePerGas, nonce, authorization, walletId } = params
  try {
    const txParams = { to, data, value, chainId, gas, maxFeePerGas, maxPriorityFeePerGas, nonce }
    const authorizationParams = {
      authorizationContractAddress: authorization.contractAddress,
      authorizationChainId: authorization.chainId,
      authorizationNonce: authorization.nonce,
      authorizationR: authorization.r,
      authorizationS: authorization.s,
      authorizationYParity: authorization.yParity,
    }
    const transactionForChallenge = JSON.stringify({ ...txParams, ...authorizationParams })

    const result = await signWithDeviceSessionOrPasskey({
      action: Action.SIGN_7702_TRANSACTION,
      walletId,
      challengeParams: { transaction: transactionForChallenge },
      signRequest: (auth) =>
        EmbeddedWalletApiClient.fetchSign7702TransactionRequest({ ...txParams, ...authorizationParams, auth }),
    })
    if (!result.signedTransaction) {
      throw new Error('No signed transaction returned from backend')
    }
    return result.signedTransaction
  } catch (error) {
    logger.error(error, { tags: { file: 'signing.ts', function: 'sign7702TransactionWithPasskey' } })
    throw error
  }
}

/**
 * Callback used by {@link exportEncryptedSeedPhrase} to obtain the signed credential for the
 * EXPORT_SEED_PHRASE ceremony. Mobile/web pass `authenticatePasskey` directly; the Extension
 * delegates to a web-app popup because WebAuthn can't run from a chrome-extension:// origin.
 */
export type GetExportCredentialFn = (params: {
  challengeOptions: string
  walletAddress?: string
}) => Promise<string | undefined>

const defaultGetExportCredential: GetExportCredentialFn = ({ challengeOptions }) =>
  authenticatePasskey(challengeOptions)

export async function exportEncryptedSeedPhrase({
  encryptionKey,
  walletId,
  getCredential = defaultGetExportCredential,
  walletAddress,
}: {
  encryptionKey: string
  walletId?: string
  getCredential?: GetExportCredentialFn
  walletAddress?: string
}): Promise<{ ciphertext: string; encapsulatedKey: string } | undefined> {
  try {
    const challengeResp = await EmbeddedWalletApiClient.fetchChallengeRequest({
      type: AuthenticationTypes.PASSKEY_AUTHENTICATION,
      action: Action.EXPORT_SEED_PHRASE,
      walletId,
      encryptionKey,
    })
    const challengeOptions = challengeResp.challengeOptions
    if (!challengeOptions) {
      return undefined
    }
    const credential = await getCredential({ challengeOptions, walletAddress })
    if (!credential) {
      return undefined
    }
    const { ciphertext, encapsulatedKey } = await EmbeddedWalletApiClient.fetchExportEncryptedSeedPhraseRequest({
      encryptionKey,
      credential,
    })
    return { ciphertext, encapsulatedKey }
  } catch (error) {
    logger.error(error, { tags: { file: 'signing.ts', function: 'exportEncryptedSeedPhrase' } })
    throw error
  }
}

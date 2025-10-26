import { WalletKitTypes } from '@reown/walletkit'
import { PairingTypes, ProposalTypes, SessionTypes, SignClientTypes, Verify } from '@walletconnect/types'
import { utils } from 'ethers'
import { wcWeb3Wallet } from 'src/features/walletConnect/walletConnectClient'
import {
  SignRequest,
  TransactionRequest,
  WalletConnectVerifyStatus,
  WalletGetCallsStatusRequest,
  WalletGetCapabilitiesRequest,
  WalletSendCallsRequest,
} from 'src/features/walletConnect/walletConnectSlice'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { EthMethod, EthSignMethod, WalletConnectEthMethod } from 'uniswap/src/features/dappRequests/types'
import { DappRequestInfo, DappRequestType } from 'uniswap/src/types/walletConnect'
import { hexToNumber } from 'utilities/src/addresses/hex'
import { generateBatchId } from 'wallet/src/features/batchedTransactions/utils'
import { GetCallsStatusParams, SendCallsParams } from 'wallet/src/features/dappRequests/types'
/**
 * Construct WalletConnect 2.0 session namespaces to complete a new pairing. Used when approving a new pairing request.
 * Assumes each namespace has been validated and is supported by the app with `validateProposalNamespaces()`.
 *
 * @param {Address} account address of account to complete WalletConnect pairing request
 * @param {ProposalTypes.OptionalNamespaces} proposalNamespaces validated proposal namespaces that specify all supported chains, methods, events for the session
 * @return {SessionTypes.Namespaces} session namespaces specifying which accounts, chains, methods, events to complete the pairing
 */
export function getSessionNamespaces(
  accounts: Address[],
  proposalNamespaces: ProposalTypes.OptionalNamespaces,
): SessionTypes.Namespaces {
  // Below inspired from https://github.com/WalletConnect/web-examples/blob/main/wallets/react-wallet-v2/src/views/SessionProposalModal.tsx#L63
  const namespaces: SessionTypes.Namespaces = {}

  Object.entries(proposalNamespaces).forEach(([nameSpaceId, namespace]) => {
    const { chains, events, methods } = namespace

    const formattedAccounts = !chains
      ? accounts.map((account) => `${nameSpaceId}:${account}`)
      : accounts.flatMap((account) => chains.map((chain) => `${chain}:${account}`))

    namespaces[nameSpaceId] = {
      accounts: formattedAccounts,
      events,
      methods,
      chains,
    }
  })

  return namespaces
}

/**
 * Convert list of chains from a WalletConnect namespace to a list of supported ChainIds
 * @param {string[]} chains list of chain strings as received from WalletConnect (ex. "eip155:1")
 * @returns {UniverseChainId[]} list of supported ChainIds
 */
export const getSupportedWalletConnectChains = (chains?: string[]): UniverseChainId[] | undefined => {
  if (!chains) {
    return undefined
  }

  return chains.map((chain) => getChainIdFromEIP155String(chain)).filter((c): c is UniverseChainId => Boolean(c))
}

/**
 * Convert chain from `eip155:[CHAIN_ID]` format to supported ChainId.
 * Returns null if chain doesn't match correct `eip155:` format or is an unsupported chain.
 */
export const getChainIdFromEIP155String = (chain: string): UniverseChainId | null => {
  const chainStr = chain.startsWith('eip155:') ? chain.split(':')[1] : undefined
  return toSupportedChainId(chainStr)
}

/**
 * Convert account from `eip155:[CHAIN_ID]:[ADDRESS]` format to account address.
 * Returns null if string doesn't match correct `eip155:chainId:address` forma.
 */
export const getAccountAddressFromEIP155String = (account: string): Address | null => {
  const address = account.startsWith('eip155:') ? account.split(':')[2] : undefined
  if (!address) {
    return null
  }
  return address
}

/**
 * Creates a base WalletConnect request object with common properties
 *
 * @param method The request method type
 * @param topic WalletConnect session ID
 * @param internalId WalletConnect request ID
 * @param account Account address
 * @param chainId Chain ID for the request
 * @param dapp Dapp metadata
 * @returns Base request object with common properties
 */
function createBaseRequest<T extends WalletConnectEthMethod>({
  method,
  topic,
  internalId,
  account,
  dapp,
}: {
  method: T
  topic: string
  internalId: number
  account: Address
  dapp: SignClientTypes.Metadata
}): {
  type: T
  sessionId: string
  internalId: string
  account: Address
  isLinkModeSupported: boolean
  dappRequestInfo: DappRequestInfo
} {
  return {
    type: method,
    sessionId: topic,
    internalId: String(internalId),
    account,
    isLinkModeSupported: Boolean(dapp.redirect?.linkMode),
    dappRequestInfo: {
      name: dapp.name,
      url: dapp.url,
      icon: dapp.icons[0] ?? null,
      requestType: DappRequestType.WalletConnectSessionRequest,
    },
  }
}

/**
 * Formats SignRequest object from WalletConnect 2.0 request parameters
 *
 * @param {EthSignMethod} method type of method to sign
 * @param {string} topic id for the WalletConnect session
 * @param {number} internalId id for the WalletConnect signature request
 * @param {ChainId} chainId chain the signature is being requested on
 * @param {SignClientTypes.Metadata} dapp metadata for the dapp requesting the signature
 * @param {WalletKitTypes.SessionRequest['params']['request']['params']} requestParams parameters of the request
 * @returns {{Address, SignRequest}} address of the account receiving the request and formatted SignRequest object
 */
export function parseSignRequest({
  method,
  topic,
  internalId,
  chainId,
  dapp,
  requestParams,
}: {
  method: EthSignMethod
  topic: string
  internalId: number
  chainId: UniverseChainId
  dapp: SignClientTypes.Metadata
  requestParams: WalletKitTypes.SessionRequest['params']['request']['params']
}): SignRequest {
  const { address, rawMessage, message } = getAddressAndMessageToSign(method, requestParams)
  return {
    ...createBaseRequest({ method, topic, internalId, account: address, dapp }),
    chainId,
    rawMessage,
    message,
  }
}

/**
 * Formats TransactionRequest object from WalletConnect 2.0 request parameters.
 * Only supports `eth_sendTransaction` request, `eth_signTransaction` is intentionally
 * unsupported since it is difficult to support to nonce calculation and tracking.
 *
 * @param {EthMethod.EthSendTransaction} method type of method to sign (only support `eth_signTransaction`)
 * @param {string} topic id for the WalletConnect session
 * @param {number} internalId id for the WalletConnect transaction request
 * @param {UniverseChainId} chainId chain the signature is being requested on
 * @param {SignClientTypes.Metadata} dapp metadata for the dapp requesting the transaction
 * @param {WalletKitTypes.SessionRequest['params']['request']['params']} requestParams parameters of the request
 * @returns {{Address, TransactionRequest}} address of the account receiving the request and formatted TransactionRequest object
 */
export function parseTransactionRequest({
  method,
  topic,
  internalId,
  chainId,
  dapp,
  requestParams,
}: {
  method: EthMethod.EthSendTransaction
  topic: string
  internalId: number
  chainId: UniverseChainId
  dapp: SignClientTypes.Metadata
  requestParams: WalletKitTypes.SessionRequest['params']['request']['params']
}): TransactionRequest {
  // Omit gasPrice and nonce in tx sent from dapp since it is calculated later
  const { from, to, data, gasLimit, value } = requestParams[0]

  return {
    ...createBaseRequest({ method, topic, internalId, account: from, dapp }),
    chainId,
    transaction: {
      to,
      from,
      value,
      data,
      gasLimit,
    },
  }
}

/**
 * Formats WalletCapabilitiesRequest object from parameters
 *
 * @param {EthMethod.WalletGetCapabilities} method type of method
 * @param {string} topic id for the WalletConnect session
 * @param {number} internalId id for the WalletConnect request
 * @param {SignClientTypes.Metadata} dapp metadata for the dapp requesting capabilities
 * @param {[string, string[]?]} requestParams parameters of the request [Wallet Address, [Chain IDs]?]
 * @returns {WalletGetCapabilitiesRequest} formatted request object
 */
export const parseGetCapabilitiesRequest = ({
  method,
  topic,
  internalId,
  dapp,
  requestParams,
}: {
  method: EthMethod.WalletGetCapabilities
  topic: string
  internalId: number
  dapp: SignClientTypes.Metadata
  requestParams: [string, string[]?]
}): WalletGetCapabilitiesRequest => {
  const [address, chainIds] = requestParams
  const parsedChainIds = chainIds
    ?.map((chainId) => toSupportedChainId(hexToNumber(chainId)))
    .filter((c): c is UniverseChainId => Boolean(c))

  return {
    ...createBaseRequest({ method, topic, internalId, account: address, dapp }), // 0 as chainId since it's not specific to a chain
    chainIds: parsedChainIds,
    account: address,
  }
}

export function parseSendCallsRequest({
  topic,
  internalId,
  chainId,
  dapp,
  requestParams,
  account,
}: {
  topic: string
  internalId: number
  chainId: number
  dapp: SignClientTypes.Metadata
  requestParams: [SendCallsParams]
  account: Address
}): WalletSendCallsRequest {
  const sendCallsParam = requestParams[0]
  const requestId = sendCallsParam.id || generateBatchId()
  return {
    ...createBaseRequest({
      method: EthMethod.WalletSendCalls,
      topic,
      internalId,
      account: sendCallsParam.from ?? account,
      dapp,
    }),
    chainId,
    calls: sendCallsParam.calls,
    capabilities: sendCallsParam.capabilities || {},
    account: sendCallsParam.from ?? account,
    id: requestId,
    version: sendCallsParam.version,
  }
}

export function parseGetCallsStatusRequest({
  topic,
  internalId,
  chainId,
  dapp,
  requestParams,
  account,
}: {
  topic: string
  internalId: number
  chainId: number
  dapp: SignClientTypes.Metadata
  requestParams: [GetCallsStatusParams]
  account: Address
}): WalletGetCallsStatusRequest {
  const requestId = requestParams[0]
  return {
    ...createBaseRequest({ method: EthMethod.WalletGetCallsStatus, topic, internalId, account, dapp }),
    chainId,
    id: requestId,
  }
}

export function decodeMessage(value: string): string {
  try {
    if (utils.isHexString(value)) {
      const decoded = utils.toUtf8String(value)
      if (decoded.trim()) {
        return decoded
      }
    }

    return value
  } catch {
    return value
  }
}

/**
 * Gets the address receiving the request, raw message, decoded message to sign based on the EthSignMethod.
 * `personal_sign` params are ordered as [message, account]
 * `eth_sign` params are ordered as [account, message]
 * `signTypedData` params are ordered as [account, message]
 * See https://docs.walletconnect.com/2.0/advanced/rpc-reference/ethereum-rpc#personal_sign
 */
// eslint-disable-next-line consistent-return
function getAddressAndMessageToSign(
  ethMethod: EthSignMethod,
  params: WalletKitTypes.SessionRequest['params']['request']['params'],
): { address: string; rawMessage: string; message: string | null } {
  switch (ethMethod) {
    case EthMethod.PersonalSign:
      return { address: params[1], rawMessage: params[0], message: decodeMessage(params[0]) }
    case EthMethod.EthSign:
      return { address: params[0], rawMessage: params[1], message: utils.toUtf8String(params[1]) }
    case EthMethod.SignTypedData:
    case EthMethod.SignTypedDataV4:
      return { address: params[0], rawMessage: params[1], message: null }
  }
}

export async function pairWithWalletConnectURI(uri: string): Promise<void | PairingTypes.Struct> {
  try {
    return await wcWeb3Wallet.pair({ uri })
  } catch (error) {
    return Promise.reject(error instanceof Error ? error.message : '')
  }
}

/**
 * Formats safety level based on the verify context from a wallet connect proposal or sesison request.
 *
 * See https://docs.reown.com/walletkit/ios/verify
 */
export function parseVerifyStatus(verifyContext?: Verify.Context): WalletConnectVerifyStatus {
  if (!verifyContext) {
    return WalletConnectVerifyStatus.Unverified
  }

  const { verified } = verifyContext

  // Must check for isScam first, since valid URLs can still be scams
  if (verified.validation === 'INVALID' || verified.isScam) {
    return WalletConnectVerifyStatus.Threat
  }

  if (verified.validation === 'VALID') {
    return WalletConnectVerifyStatus.Verified
  }

  // Default to unverified status to enforce stricter warning if verification information is empty
  // Also covers 'UNKNOWN' case
  return WalletConnectVerifyStatus.Unverified
}

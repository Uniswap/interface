import { WalletKitTypes } from '@reown/walletkit'
import { PairingTypes, ProposalTypes, SessionTypes, SignClientTypes } from '@walletconnect/types'
import { utils } from 'ethers'
import { wcWeb3Wallet } from 'src/features/walletConnect/saga'
import {
  SignRequest,
  TransactionRequest,
  WalletCapabilitiesRequest,
  WalletGetCallsStatusRequest,
  WalletSendCallsRequest,
} from 'src/features/walletConnect/walletConnectSlice'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { EthMethod } from 'uniswap/src/features/dappRequests/types'
import { EthSignMethod } from 'uniswap/src/types/walletConnect'
import { GetCallsStatusParams, SendCallsParams } from 'wallet/src/features/dappRequests/types'

/**
 * Construct WalletConnect 2.0 session namespaces to complete a new pairing. Used when approving a new pairing request.
 * Assumes each namespace has been validated and is supported by the app with `validateProposalNamespaces()`.
 *
 * @param {Address} account address of account to complete WalletConnect pairing request
 * @param {ProposalTypes.RequiredNamespaces} proposalNamespaces validated proposal namespaces that specify all supported chains, methods, events for the session
 * @return {SessionTypes.Namespaces} session namespaces specifying which accounts, chains, methods, events to complete the pairing
 */
export const getSessionNamespaces = (
  account: Address,
  proposalNamespaces: ProposalTypes.RequiredNamespaces,
): SessionTypes.Namespaces => {
  // Below inspired from https://github.com/WalletConnect/web-examples/blob/main/wallets/react-wallet-v2/src/views/SessionProposalModal.tsx#L63
  const namespaces: SessionTypes.Namespaces = {}

  Object.entries(proposalNamespaces).forEach(([key, namespace]) => {
    const { chains, events, methods } = namespace
    namespaces[key] = {
      accounts: chains ? chains.map((chain) => `${chain}:${account}`) : [`${key}:${account}`],
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
function createBaseRequest<T extends EthMethod>(
  method: T,
  topic: string,
  internalId: number,
  account: Address,
  dapp: SignClientTypes.Metadata,
): {
  type: T
  sessionId: string
  internalId: string
  account: Address
  dapp: {
    name: string
    url: string
    icon: string | null
    source: 'walletconnect'
  }
} {
  return {
    type: method,
    sessionId: topic,
    internalId: String(internalId),
    account,
    dapp: {
      name: dapp.name,
      url: dapp.url,
      icon: dapp.icons[0] ?? null,
      source: 'walletconnect',
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
export const parseSignRequest = (
  method: EthSignMethod,
  topic: string,
  internalId: number,
  chainId: UniverseChainId,
  dapp: SignClientTypes.Metadata,
  requestParams: WalletKitTypes.SessionRequest['params']['request']['params'],
): SignRequest => {
  const { address, rawMessage, message } = getAddressAndMessageToSign(method, requestParams)
  return {
    ...createBaseRequest(method, topic, internalId, address, dapp),
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
export const parseTransactionRequest = (
  method: EthMethod.EthSendTransaction,
  topic: string,
  internalId: number,
  chainId: UniverseChainId,
  dapp: SignClientTypes.Metadata,
  requestParams: WalletKitTypes.SessionRequest['params']['request']['params'],
): TransactionRequest => {
  // Omit gasPrice and nonce in tx sent from dapp since it is calculated later
  const { from, to, data, gasLimit, value } = requestParams[0]

  return {
    ...createBaseRequest(method, topic, internalId, from, dapp),
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
 * @param {EthMethod.GetCapabilities} method type of method
 * @param {string} topic id for the WalletConnect session
 * @param {number} internalId id for the WalletConnect request
 * @param {SignClientTypes.Metadata} dapp metadata for the dapp requesting capabilities
 * @param {[string, string[]?]} requestParams parameters of the request [Wallet Address, [Chain IDs]?]
 * @returns {WalletCapabilitiesRequest} formatted request object
 */
export const parseGetCapabilitiesRequest = (
  method: EthMethod.GetCapabilities,
  topic: string,
  internalId: number,
  dapp: SignClientTypes.Metadata,
  requestParams: [string, string[]?],
): WalletCapabilitiesRequest => {
  const [address, chainIds] = requestParams
  const parsedChainIds = chainIds
    ?.map((chainId) => toSupportedChainId(chainId))
    .filter((c): c is UniverseChainId => Boolean(c))

  return {
    ...createBaseRequest(method, topic, internalId, address, dapp), // 0 as chainId since it's not specific to a chain
    chainIds: parsedChainIds,
  }
}

export const parseSendCallsRequest = (
  topic: string,
  internalId: number,
  chainId: number,
  dapp: SignClientTypes.Metadata,
  requestParams: [SendCallsParams],
  account: Address,
): WalletSendCallsRequest => {
  const sendCallsParam = requestParams[0]
  const requestId = sendCallsParam.id || 'mock-batch-id (will be txID or `id` from request)'
  return {
    ...createBaseRequest(EthMethod.SendCalls, topic, internalId, sendCallsParam.from ?? account, dapp),
    chainId,
    calls: sendCallsParam.calls,
    capabilities: sendCallsParam.capabilities || {},
    account: sendCallsParam.from ?? account,
    id: requestId,
    version: sendCallsParam.version,
  }
}

export const parseGetCallsStatusRequest = (
  topic: string,
  internalId: number,
  chainId: number,
  dapp: SignClientTypes.Metadata,
  requestParams: [GetCallsStatusParams],
  account: Address,
): WalletGetCallsStatusRequest => {
  const requestId = requestParams[0]
  return {
    ...createBaseRequest(EthMethod.GetCallsStatus, topic, internalId, account, dapp),
    chainId,
    id: requestId,
  }
}

export function decodeMessage(value: string): string {
  try {
    if (utils.isHexString(value)) {
      const decoded = utils.toUtf8String(value)
      if (decoded?.trim()) {
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

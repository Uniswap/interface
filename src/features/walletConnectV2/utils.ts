import { ProposalTypes, SessionTypes, SignClientTypes } from '@walletconnect/types'
import { Web3WalletTypes } from '@walletconnect/web3wallet'
import { utils } from 'ethers'
import { ChainId } from 'src/constants/chains'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { EthMethod, EthSignMethod } from 'src/features/walletConnect/types'
import { SignRequest } from 'src/features/walletConnect/walletConnectSlice'
import { toSupportedChainId } from 'src/utils/chainId'

/**
 * Construct WalletConnect 2.0 session namespaces to complete a new pairing. Used when approving a new pairing request.
 * @param {Address} account address of account to complete WalletConnect pairing request
 * @param {ProposalTypes.RequiredNamespaces} requiredNamespaces proposal namespaces that specify requested chains, methods, events for a connection
 * @return {SessionTypes.Namespaces} session namespaces specifying which accounts, chains, methods, events to complete the pairing
 * @return {ChainId[]} list of supported ChainIds for the session
 */
export const getSessionNamespaces = (
  account: Address,
  requiredNamespaces: ProposalTypes.RequiredNamespaces
): { namespaces: SessionTypes.Namespaces; chains: ChainId[] } => {
  // below inspired from https://github.com/WalletConnect/web-examples/blob/main/wallets/react-wallet-v2/src/views/SessionProposalModal.tsx#L63

  // only support eip155 because EVM
  const eip155Namespaces = requiredNamespaces.eip155

  if (!eip155Namespaces) {
    throw new Error('WalletConnect session proposal does not include any EVM chains.')
  }

  const chains = getSupportedWalletConnectChains(eip155Namespaces.chains)

  // Create accounts array for each EVM chain requested
  const accounts = chains.map((supportedChain) => `eip155:${supportedChain}:${account}`)

  const namespaces = {
    eip155: {
      accounts,
      events: eip155Namespaces.events,
      methods: eip155Namespaces.methods,
    },
  }
  return { namespaces, chains }
}

/**
 * Convert list of chains from a WalletConnect namespace to a list of supported ChainIds
 * @param {string[]} chains list of chain strings as received from WalletConnect (ex. "eip155:1")
 * @returns {ChainId[]} list of supported ChainIds
 */
export const getSupportedWalletConnectChains = (chains?: string[]): ChainId[] => {
  if (!chains) return EMPTY_ARRAY

  return chains
    .map((chain) => getChainIdFromEIP155String(chain))
    .filter((c): c is ChainId => Boolean(c))
}

/**
 * Convert chain from `eip155:[CHAIN_ID]` format to supported ChainId.
 * Returns undefined if chain doesn't match correct `eip155:` format or is an unsupported chain.
 */
export const getChainIdFromEIP155String = (chain: string): ChainId | null => {
  const chainStr = chain.startsWith('eip155:') ? chain.split(':')[1] : undefined
  return toSupportedChainId(chainStr)
}

/**
 * Formats SignRequestV2 object from WalletConnect 2.0 request parameters
 *
 * @param {EthSignMethod} method type of method to sign
 * @param {string} topic id for the WalletConnect session
 * @param {number} internalId id for the WalletConnect signature request
 * @param {ChainId} chainId chain the signature is being requested on
 * @param {SignClientTypes.Metadata} dapp metadata for the dapp requesting the signature
 * @param {Web3WalletTypes.SessionRequest['params']['request']['params']} requestParams parameters of the request
 * @returns {{Address, SignRequest}} address of the account receiving the request and formatted SignRequest object
 */
export const parseSignRequest = (
  method: EthSignMethod,
  topic: string,
  internalId: number,
  chainId: ChainId,
  dapp: SignClientTypes.Metadata,
  requestParams: Web3WalletTypes.SessionRequest['params']['request']['params']
): { account: Address; request: SignRequest } => {
  const { address, rawMessage, message } = getAddressAndMessageToSign(method, requestParams)
  return {
    account: address,
    request: {
      type: method,
      sessionId: topic,
      internalId: String(internalId),
      rawMessage,
      message,
      account: address,
      chainId,
      dapp: {
        name: dapp.name,
        url: dapp.url,
        icon: dapp.icons[0] ?? null,
        version: '2',
      },
      version: '2',
    },
  }
}

/**
 * Gets the address receiving the request, raw message, decoded message to sign based on the EthSignMethod.
 * `personal_sign` params are ordered as [message, account]
 * `eth_sign` params are ordered as [account, message]
 * `signTypedData` params are ordered as [account, message]
 * See https://docs.walletconnect.com/2.0/advanced/rpc-reference/ethereum-rpc#personal_sign
 */
export function getAddressAndMessageToSign(
  ethMethod: EthSignMethod,
  params: Web3WalletTypes.SessionRequest['params']['request']['params']
): { address: string; rawMessage: string; message: string | null } {
  switch (ethMethod) {
    case EthMethod.PersonalSign:
      return { address: params[1], rawMessage: params[0], message: utils.toUtf8String(params[0]) }
    case EthMethod.EthSign:
      return { address: params[0], rawMessage: params[1], message: utils.toUtf8String(params[1]) }
    case EthMethod.SignTypedData:
    case EthMethod.SignTypedDataV4:
      return { address: params[0], rawMessage: params[1], message: null }
  }
}

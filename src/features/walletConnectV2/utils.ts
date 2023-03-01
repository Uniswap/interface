import { ProposalTypes, SessionTypes } from '@walletconnect/types'
import { ChainId } from 'src/constants/chains'
import { EMPTY_ARRAY } from 'src/constants/misc'
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
    .map((chain) => toSupportedChainId(getChainFromEIP155String(chain)))
    .filter((c): c is ChainId => Boolean(c))
}

/**
 * Convert chain from `eip155:[CHAIN_ID]` format to chain id.
 * Returns undefined if chain doesn't match correct `eip155:` format.
 */
export const getChainFromEIP155String = (chain: string): string | undefined => {
  return chain.startsWith('eip155:') ? chain.split(':')[1] : undefined
}

import { CONNECTION } from 'components/Web3Provider/constants'
import { WalletConnectConnector } from 'components/Web3Provider/walletConnect'
import { useAccount } from 'hooks/useAccount'
import { ALL_CHAIN_IDS } from 'uniswap/src/constants/chains'
import { InterfaceChainId } from 'uniswap/src/types/chains'

// Returns the chain ids supported by the user's connected wallet
export function useConnectedWalletSupportedChains(): InterfaceChainId[] {
  const { connector } = useAccount()

  switch (connector?.type) {
    case CONNECTION.UNISWAP_WALLET_CONNECT_CONNECTOR_ID:
    case CONNECTION.WALLET_CONNECT_CONNECTOR_ID:
      // Wagmi currently offers no way to discriminate a Connector as a WalletConnect connector providing access to getNamespaceChainsIds.
      return (connector as WalletConnectConnector).getNamespaceChainsIds?.().length
        ? (connector as WalletConnectConnector).getNamespaceChainsIds?.()
        : ALL_CHAIN_IDS
    default:
      return ALL_CHAIN_IDS
  }
}

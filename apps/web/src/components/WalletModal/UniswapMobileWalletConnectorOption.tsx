import { WalletConnectorOption } from 'components/WalletModal/WalletConnectorOption'
import { useWalletConnectors } from 'features/wallet/connection/hooks/useWalletConnectors'
import { getConnectorWithIdWithThrow } from 'features/wallet/connection/utils'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'

export function UniswapMobileWalletConnectorOption() {
  const connectors = useWalletConnectors()

  return (
    <WalletConnectorOption
      walletConnectorMeta={getConnectorWithIdWithThrow({
        connectors,
        id: CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID,
      })}
    />
  )
}

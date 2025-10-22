import { WalletConnectorOption } from 'components/WalletModal/WalletConnectorOption'
import { useWalletWithId } from 'features/accounts/store/hooks'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'

export function UniswapMobileWalletConnectorOption() {
  const wallet = useWalletWithId(CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID)

  if (!wallet) {
    return null
  }

  return <WalletConnectorOption wallet={wallet} />
}

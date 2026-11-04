import { isMobileWeb } from '@universe/environment'
import { QrCode } from '@universe/mycelium/icons/QrCode'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { useWalletWithId } from '~/connection/accounts/hooks'
import { WalletConnectorOption } from '~/features/wallet/components/WalletModal/WalletConnectorOption'

export function UniswapMobileWalletConnectorOption() {
  const wallet = useWalletWithId(CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID)

  if (!wallet) {
    return null
  }

  return (
    <WalletConnectorOption
      wallet={wallet}
      rightSideDetail={!isMobileWeb ? <QrCode size="$icon.20" color="$neutral2" /> : null}
    />
  )
}

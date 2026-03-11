import { QrCode } from 'ui/src/components/icons/QrCode'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { isMobileWeb } from 'utilities/src/platform'
import { WalletConnectorOption } from '~/components/WalletModal/WalletConnectorOption'
import { useWalletWithId } from '~/features/accounts/store/hooks'

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

import { Connector } from '@web3-react/types'
import { gnosisSafe, injected, network } from 'connectors'
import { getConnectionForConnectionType } from 'connectors/utils'
import { useEffect } from 'react'
import { BACKFILLABLE_WALLETS } from 'state/connection/constants'
import { useAppSelector } from 'state/hooks'
import { isMobile } from 'utils/userAgent'

async function connect(connector: Connector) {
  try {
    if (connector.connectEagerly) {
      await connector.connectEagerly()
    } else {
      await connector.activate()
    }
  } catch (error) {
    console.debug(`web3-react eager connection error: ${error}`)
  }
}

export default function useEagerlyConnect() {
  const selectedWalletBackfilled = useAppSelector((state) => state.user.selectedWalletBackfilled)
  const selectedWallet = useAppSelector((state) => state.user.selectedWallet)

  const isMetaMask = !!window.ethereum?.isMetaMask

  useEffect(() => {
    connect(gnosisSafe.connector)
    connect(network.connector)

    if (isMobile && isMetaMask) {
      injected.connector.activate()
    } else if (selectedWallet) {
      connect(getConnectionForConnectionType(selectedWallet).connector)
    } else if (!selectedWalletBackfilled) {
      BACKFILLABLE_WALLETS.map(getConnectionForConnectionType)
        .map((connection) => connection.connector)
        .forEach(connect)
    }
    // The dependency list is empty so this is only run once on mount
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}

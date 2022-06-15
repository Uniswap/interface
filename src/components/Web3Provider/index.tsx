import { Web3ReactProvider } from '@web3-react/core'
import { Connector } from '@web3-react/types'
import { getConnectorForWallet, gnosisSafe, MODAL_WALLETS, network, useConnectors, Wallet } from 'connectors'
import { ReactNode, useEffect } from 'react'
import { useAppSelector } from 'state/hooks'

const connect = async (connector: Connector) => {
  try {
    if (connector.connectEagerly) {
      await connector.connectEagerly()
    } else {
      await connector.activate()
    }
  } catch (error) {
    console.debug(`web3-react error: ${error}`)
  }
}

export default function Web3Provider({ children }: { children: ReactNode }) {
  const selectedWalletBackfilled = useAppSelector((state) => state.user.selectedWalletBackfilled)
  const selectedWallet = useAppSelector((state) => state.user.selectedWallet)

  const connectors = useConnectors(selectedWallet)

  useEffect(() => {
    connect(gnosisSafe)
    connect(network)

    if (selectedWallet) {
      connect(getConnectorForWallet(selectedWallet))
    } else if (!selectedWalletBackfilled) {
      MODAL_WALLETS.filter((wallet) => wallet !== Wallet.FORTMATIC) // Don't try to connect to Fortmatic because it opens up a modal
        .map(getConnectorForWallet)
        .forEach(connect)
    }
    // The dependency list is empty so this is only run once on mount
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <Web3ReactProvider connectors={connectors}>{children}</Web3ReactProvider>
}

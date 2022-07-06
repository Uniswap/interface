import { Web3ReactHooks } from '@web3-react/core'
import { Connector } from '@web3-react/types'
import { gnosisSafe, injected, network, Wallet } from 'connectors'
import { getConnectorForWallet, getHooksForWallet } from 'connectors/utils'
import { useEffect, useMemo } from 'react'
import { useAppSelector } from 'state/hooks'

import { isMobile } from '../../utils/userAgent'

export const BACKFILLABLE_WALLETS = [Wallet.COINBASE_WALLET, Wallet.WALLET_CONNECT, Wallet.INJECTED]
export const SELECTABLE_WALLETS = [...BACKFILLABLE_WALLETS, Wallet.FORTMATIC]

interface Connection {
  connector: Connector
  hooks: Web3ReactHooks
}

function getConnectionForWallet(wallet: Wallet) {
  return {
    connector: getConnectorForWallet(wallet),
    hooks: getHooksForWallet(wallet),
  }
}

export function useConnectors() {
  const selectedWallet = useAppSelector((state) => state.user.selectedWallet)
  return useMemo(() => {
    const connections: Connection[] = []

    // Always attempt to use to Gnosis Safe first, as we can't know if we're in a SafeContext.
    connections.push(getConnectionForWallet(Wallet.GNOSIS_SAFE))

    // Add the `selectedWallet` to the top so it's prioritized, then add the other selectable wallets.
    if (selectedWallet) {
      connections.push(getConnectionForWallet(selectedWallet))
    }
    connections.push(...SELECTABLE_WALLETS.filter((wallet) => wallet !== selectedWallet).map(getConnectionForWallet))

    // Add network connection last as it should be the fallback.
    connections.push(getConnectionForWallet(Wallet.NETWORK))

    // Convert to web3-react's representation of connectors.
    return connections.map(({ connector, hooks }) => [connector, hooks])
  }, [selectedWallet])
}

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

export function useEagerlyConnect() {
  const selectedWalletBackfilled = useAppSelector((state) => state.user.selectedWalletBackfilled)
  const selectedWallet = useAppSelector((state) => state.user.selectedWallet)

  const isMetaMask = !!window.ethereum?.isMetaMask

  useEffect(() => {
    connect(gnosisSafe)
    connect(network)

    if (isMobile && isMetaMask) {
      injected.activate()
    } else if (selectedWallet) {
      connect(getConnectorForWallet(selectedWallet))
    } else if (!selectedWalletBackfilled) {
      BACKFILLABLE_WALLETS.map(getConnectorForWallet).forEach(connect)
    }
    // The dependency list is empty so this is only run once on mount
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}

import { Web3ReactProvider } from '@web3-react/core'
import { Connector } from '@web3-react/types'
import { getConnectorForWallet, gnosisSafe, MODAL_WALLETS, network, useConnectors, Wallet } from 'connectors'
import useIsActiveMap from 'hooks/useIsActiveMap'
import usePrevious from 'hooks/usePrevious'
import { ReactNode, useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { updateSelectedWallet } from 'state/user/reducer'

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

// This component handles state changes in web3-react.
// It eagerly connects to gnosis safe, network, and the selectedWallet.
// It also checks for Coinbase Wallet, Wallet Connect Fortmatic or Injected wallets to become active.
function Web3Updater() {
  const dispatch = useAppDispatch()

  const selectedWallet = useAppSelector((state) => state.user.selectedWallet)
  const selectedWalletBackfilled = useAppSelector((state) => state.user.selectedWalletBackfilled)

  const [isEagerlyConnecting, setIsEagerlyConnecting] = useState(false)
  const isActiveMap = useIsActiveMap()
  const previousIsActiveMap = usePrevious(isActiveMap)

  // Connects eagerly to connectors.
  useEffect(() => {
    connect(gnosisSafe)
    connect(network)

    if (selectedWallet) {
      connect(getConnectorForWallet(selectedWallet))
      setIsEagerlyConnecting(true)
    } else if (!selectedWalletBackfilled) {
      MODAL_WALLETS.filter((wallet) => wallet !== Wallet.FORTMATIC) // Don't try to connect to Fortmatic because it opens up a modal
        .map(getConnectorForWallet)
        .forEach(connect)
      setIsEagerlyConnecting(true)
    }
    // The dependency list is empty so this is only run once on mount
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Checks for connection changes within wallet connectors.
  useEffect(() => {
    isActiveMap.forEach((isActive: boolean, wallet: Wallet) => {
      if (isActive && !previousIsActiveMap?.get(wallet)) {
        if (isEagerlyConnecting) {
          setIsEagerlyConnecting(false)
        } else if (!selectedWalletBackfilled) {
          // When a user manually sets their new connection, set a selectedWallet.
          // Also set an override when they were a user prior to this state being introduced.
          dispatch(updateSelectedWallet({ wallet }))
        }
      }
    })
  }, [
    dispatch,
    isActiveMap,
    previousIsActiveMap,
    isEagerlyConnecting,
    setIsEagerlyConnecting,
    selectedWallet,
    selectedWalletBackfilled,
  ])

  return null
}

export default function Web3Provider({ children }: { children: ReactNode }) {
  const selectedWallet = useAppSelector((state) => state.user.selectedWallet)
  const connectors = useConnectors(selectedWallet)
  return (
    <Web3ReactProvider connectors={connectors}>
      <Web3Updater />
      {children}
    </Web3ReactProvider>
  )
}

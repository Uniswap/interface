import { Web3ReactProvider } from '@web3-react/core'
import { Connector } from '@web3-react/types'
import {
  coinbaseWalletHooks,
  createOrderedConnectors,
  fortmaticHooks,
  getConnectorForWallet,
  gnosisSafe,
  injectedHooks,
  MODAL_WALLETS,
  network,
  Wallet,
  walletConnectHooks,
} from 'connectors'
import usePrevious from 'hooks/usePrevious'
import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { updateWalletOverride } from 'state/walletOverride/reducer'

const connect = async (connector: Connector) => {
  try {
    if (connector.connectEagerly) {
      await connector.connectEagerly()
    } else {
      await connector.activate()
    }
  } catch (error) {
    console.debug(`web3-react error: ${typeof connector}, ${error}`)
  }
}

interface ConnectorState {
  isActive: boolean
  previousIsActive: boolean | undefined
}

// This component handles state changes in web3-react. It eagerly connects to all wallets.
// It also checks for Coinbase Wallet, Wallet Connect Fortmatic or Injected wallets to become active.
function Web3Updater() {
  const dispatch = useAppDispatch()

  const walletOverride = useAppSelector((state) => state.walletOverride.walletOverride)
  const walletOverrideBackfilled = useAppSelector((state) => state.walletOverride.walletOverrideBackfilled)

  const injectedIsActive = injectedHooks.useIsActive()
  const previousInjectedIsActive = usePrevious(injectedIsActive)

  const coinbaseWalletIsActive = coinbaseWalletHooks.useIsActive()
  const previousCoinbaseWalletIsActive = usePrevious(coinbaseWalletIsActive)

  const walletConnectIsActive = walletConnectHooks.useIsActive()
  const previousWalletConnectIsActive = usePrevious(walletConnectIsActive)

  const fortmaticIsActive = fortmaticHooks.useIsActive()
  const previousFortmaticIsActive = usePrevious(fortmaticIsActive)

  const [isEagerlyConnecting, setIsEagerlyConnecting] = useState(false)

  // The dependency list is empty so this is only run once on mount
  useEffect(() => {
    connect(gnosisSafe)
    connect(network)

    if (walletOverride) {
      connect(getConnectorForWallet(walletOverride))
      setIsEagerlyConnecting(true)
    } else if (!walletOverrideBackfilled) {
      MODAL_WALLETS.filter((wallet) => wallet !== Wallet.FORTMATIC)
        .map(getConnectorForWallet)
        .forEach(connect)
      setIsEagerlyConnecting(true)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const injectedState: ConnectorState = {
      isActive: injectedIsActive,
      previousIsActive: previousInjectedIsActive,
    }
    const coinbaseWalletState: ConnectorState = {
      isActive: coinbaseWalletIsActive,
      previousIsActive: previousCoinbaseWalletIsActive,
    }
    const walletConnectState: ConnectorState = {
      isActive: walletConnectIsActive,
      previousIsActive: previousWalletConnectIsActive,
    }
    const fortmaticState: ConnectorState = {
      isActive: fortmaticIsActive,
      previousIsActive: previousFortmaticIsActive,
    }
    const isActiveMap = new Map<Wallet, ConnectorState>([
      [Wallet.INJECTED, injectedState],
      [Wallet.COINBASE_WALLET, coinbaseWalletState],
      [Wallet.WALLET_CONNECT, walletConnectState],
      [Wallet.FORTMATIC, fortmaticState],
    ])

    isActiveMap.forEach((state: ConnectorState, wallet: Wallet) => {
      const { isActive, previousIsActive } = state
      if (isActive && !previousIsActive) {
        // When a user manually sets their new connection, set a wallet override.
        // Also set an override when they were a user prior to this state being introduced.
        if (!isEagerlyConnecting || !walletOverrideBackfilled) {
          dispatch(updateWalletOverride({ wallet }))
        }

        // Reset the eagerly connecting state.
        if (isEagerlyConnecting) {
          setIsEagerlyConnecting(false)
        }
      }
    })
  }, [
    dispatch,
    walletOverride,
    walletOverrideBackfilled,
    injectedIsActive,
    coinbaseWalletIsActive,
    walletConnectIsActive,
    previousInjectedIsActive,
    previousCoinbaseWalletIsActive,
    previousWalletConnectIsActive,
    fortmaticIsActive,
    previousFortmaticIsActive,
    isEagerlyConnecting,
    setIsEagerlyConnecting,
  ])

  return null
}

interface Props {
  children: JSX.Element
}

export default function Web3Provider({ children }: Props) {
  const walletOverride = useAppSelector((state) => state.walletOverride.walletOverride)
  const connectors = createOrderedConnectors(walletOverride)
  return (
    <Web3ReactProvider connectors={connectors}>
      <Web3Updater />
      {children}
    </Web3ReactProvider>
  )
}

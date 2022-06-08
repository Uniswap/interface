import { useWeb3React, Web3ReactProvider } from '@web3-react/core'
import { Connector } from '@web3-react/types'
import {
  coinbaseWallet,
  createOrderedConnectors,
  fortmatic,
  getConnectorForWallet,
  gnosisSafe,
  injected,
  network,
  Wallet,
  walletConnect,
  WALLETS,
} from 'connectors'
import usePrevious from 'hooks/usePrevious'
import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { updateConnectorError, updateWalletOverride } from 'state/wallet/reducer'

const connectEagerly = async (connector: Connector) => {
  if (!connector.connectEagerly) return
  try {
    await connector.connectEagerly()
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
  const { hooks } = useWeb3React()

  const walletOverride = useAppSelector((state) => state.wallet.walletOverride)
  const walletOverrideBackfilled = useAppSelector((state) => state.wallet.walletOverrideBackfilled)

  const injectedIsActive = hooks.useSelectedIsActive(injected)
  const previousInjectedIsActive = usePrevious(injectedIsActive)

  const coinbaseWalletIsActive = hooks.useSelectedIsActive(coinbaseWallet)
  const previousCoinbaseWalletIsActive = usePrevious(coinbaseWalletIsActive)

  const walletConnectIsActive = hooks.useSelectedIsActive(walletConnect)
  const previousWalletConnectIsActive = usePrevious(walletConnectIsActive)

  const fortmaticIsActive = hooks.useSelectedIsActive(fortmatic)
  const previousFortmaticIsActive = usePrevious(fortmaticIsActive)

  const [isEagerlyConnecting, setIsEagerlyConnecting] = useState(false)

  // The dependency list is empty so this is only run once on mount
  useEffect(() => {
    dispatch(updateConnectorError({ error: undefined }))

    connectEagerly(gnosisSafe)
    connectEagerly(network)

    if (walletOverride) {
      connectEagerly(getConnectorForWallet(walletOverride))
      setIsEagerlyConnecting(true)
    } else if (!walletOverrideBackfilled) {
      WALLETS.filter((wallet) => wallet !== Wallet.FORTMATIC)
        .map(getConnectorForWallet)
        .forEach(connectEagerly)
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
  const walletOverride = useAppSelector((state) => state.wallet.walletOverride)
  const connectors = createOrderedConnectors(walletOverride)
  return (
    <Web3ReactProvider connectors={connectors}>
      <Web3Updater />
      {children}
    </Web3ReactProvider>
  )
}

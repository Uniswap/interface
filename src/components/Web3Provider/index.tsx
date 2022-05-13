import { useWeb3React, Web3ReactProvider } from '@web3-react/core'
import { coinbaseWallet, gnosisSafe, injected, walletConnect } from 'connectors'
import { connectors } from 'connectors'
import { getConnectorForWallet, Wallet } from 'constants/wallet'
import usePrevious from 'hooks/usePrevious'
import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { updateWalletOverride } from 'state/user/reducer'

interface ConnectorState {
  isActive: boolean
  previousIsActive: boolean | undefined
}

const WALLETS = [Wallet.COINBASE_WALLET, Wallet.WALLET_CONNECT, Wallet.INJECTED]

// This component handles state changes in web3-react and updates wallet connections as needed.
function Web3Updater() {
  const dispatch = useAppDispatch()
  const { hooks } = useWeb3React()

  const walletOverride = useAppSelector((state) => state.user.walletOverride)
  const walletOverrideBackfilled = useAppSelector((state) => state.user.walletOverrideBackfilled)

  const injectedIsActive = hooks.useSelectedIsActive(injected)
  const previousInjectedIsActive = usePrevious(injectedIsActive)

  const coinbaseWalletIsActive = hooks.useSelectedIsActive(coinbaseWallet)
  const previousCoinbaseWalletIsActive = usePrevious(coinbaseWalletIsActive)

  const walletConnectIsActive = hooks.useSelectedIsActive(walletConnect)
  const previousWalletConnectIsActive = usePrevious(walletConnectIsActive)

  const [eagerlyConnectingWallets, setEagerlyConnectingWallets] = useState(new Set())

  useEffect(() => {
    gnosisSafe.connectEagerly()
    if (walletOverrideBackfilled) {
      const connectorOverride = walletOverride ? getConnectorForWallet(walletOverride) : undefined
      connectorOverride?.connectEagerly()
      setEagerlyConnectingWallets(new Set([walletOverride]))
    } else {
      injected.connectEagerly()
      walletConnect.connectEagerly()
      coinbaseWallet.connectEagerly()
      setEagerlyConnectingWallets(new Set(WALLETS))
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
    const isActiveMap = new Map<Wallet, ConnectorState>([
      [Wallet.INJECTED, injectedState],
      [Wallet.COINBASE_WALLET, coinbaseWalletState],
      [Wallet.WALLET_CONNECT, walletConnectState],
    ])

    isActiveMap.forEach((state: ConnectorState, wallet: Wallet) => {
      const { isActive, previousIsActive } = state
      const isEagerlyConnecting = eagerlyConnectingWallets.has(wallet)
      if (isActive && !previousIsActive) {
        // When a user manually sets their new connection, set a wallet override.
        // Also set an override when they were a user prior to this state being introduced.
        // Deactivates the previously connected wallet when a new wallet is connected.
        if (!isEagerlyConnecting || !walletOverrideBackfilled) {
          // walletOverride should always be defined here, but need for type safety.
          if (walletOverride) {
            getConnectorForWallet(walletOverride).deactivate()
          }
          dispatch(updateWalletOverride({ wallet }))
        }

        // Reset the eagerly connecting state.
        if (isEagerlyConnecting) {
          eagerlyConnectingWallets.delete(wallet)
          setEagerlyConnectingWallets(new Set([...eagerlyConnectingWallets]))
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
    eagerlyConnectingWallets,
    setEagerlyConnectingWallets,
  ])

  return null
}

interface Props {
  children: JSX.Element
}

export default function Web3Provider({ children }: Props) {
  return (
    <Web3ReactProvider connectors={connectors}>
      <Web3Updater />
      {children}
    </Web3ReactProvider>
  )
}

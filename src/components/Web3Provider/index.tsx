import { useWeb3React, Web3ReactProvider } from '@web3-react/core'
import { coinbaseWallet, gnosisSafe, injected, network, walletConnect } from 'connectors'
import { connectors } from 'connectors'
import { getConnectorForWallet, Wallet } from 'constants/wallet'
import usePrevious from 'hooks/usePrevious'
import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { updateWalletOverride } from 'state/user/reducer'

interface ConnectorState {
  isActive: boolean
  previousIsActive: boolean | undefined
  isEagerlyConnecting: boolean
  setIsEagerlyConnecting(connecting: boolean): void
}

// This component handles state changes in web3-react and updates wallet connections as needed.
function Web3Updater() {
  const dispatch = useAppDispatch()
  const { hooks } = useWeb3React()

  const walletOverride = useAppSelector((state) => state.user.walletOverride)
  const walletOverrideBackfilled = useAppSelector((state) => state.user.walletOverrideBackfilled)
  const connectorOverride = walletOverride ? getConnectorForWallet(walletOverride) : undefined

  const injectedIsActive = hooks.useSelectedIsActive(injected)
  const coinbaseWalletIsActive = hooks.useSelectedIsActive(coinbaseWallet)
  const walletConnectIsActive = hooks.useSelectedIsActive(walletConnect)

  const previousInjectedIsActive = usePrevious(injectedIsActive)
  const previousCoinbaseWalletIsActive = usePrevious(coinbaseWalletIsActive)
  const previousWalletConnectIsActive = usePrevious(walletConnectIsActive)

  const [isInjectedEagerlyConnecting, setIsInjectedEagerlyConnecting] = useState(false)
  const [isCoinbaseWalletEagerlyConnecting, setIsCoinbaseWalletEagerlyConnecting] = useState(false)
  const [isWalletConnectEagerlyConnecting, setIsWalletConnectEagerlyConnecting] = useState(false)

  useEffect(() => {
    network.connectEagerly?.()
    gnosisSafe.connectEagerly()

    if (walletOverrideBackfilled) {
      connectorOverride?.connectEagerly()
    } else {
      injected.connectEagerly()
      setIsInjectedEagerlyConnecting(true)

      walletConnect.connectEagerly()
      setIsWalletConnectEagerlyConnecting(true)

      coinbaseWallet.connectEagerly()
      setIsCoinbaseWalletEagerlyConnecting(true)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const injectedState: ConnectorState = {
      isActive: injectedIsActive,
      previousIsActive: previousInjectedIsActive,
      isEagerlyConnecting: isInjectedEagerlyConnecting,
      setIsEagerlyConnecting: setIsInjectedEagerlyConnecting,
    }
    const coinbaseWalletState: ConnectorState = {
      isActive: coinbaseWalletIsActive,
      previousIsActive: previousCoinbaseWalletIsActive,
      isEagerlyConnecting: isCoinbaseWalletEagerlyConnecting,
      setIsEagerlyConnecting: setIsCoinbaseWalletEagerlyConnecting,
    }
    const walletConnectState: ConnectorState = {
      isActive: walletConnectIsActive,
      previousIsActive: previousWalletConnectIsActive,
      isEagerlyConnecting: isWalletConnectEagerlyConnecting,
      setIsEagerlyConnecting: setIsWalletConnectEagerlyConnecting,
    }
    const isActiveMap = new Map<Wallet, ConnectorState>([
      [Wallet.INJECTED, injectedState],
      [Wallet.COINBASE_WALLET, coinbaseWalletState],
      [Wallet.WALLET_CONNECT, walletConnectState],
    ])

    isActiveMap.forEach((state: ConnectorState, wallet: Wallet) => {
      const { isActive, previousIsActive, isEagerlyConnecting, setIsEagerlyConnecting } = state
      if (isActive && !previousIsActive) {
        // Reset the eagerly connecting state.
        if (isEagerlyConnecting) {
          setIsEagerlyConnecting(false)
        }

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
    isInjectedEagerlyConnecting,
    isCoinbaseWalletEagerlyConnecting,
    isWalletConnectEagerlyConnecting,
    setIsInjectedEagerlyConnecting,
    setIsCoinbaseWalletEagerlyConnecting,
    setIsWalletConnectEagerlyConnecting,
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

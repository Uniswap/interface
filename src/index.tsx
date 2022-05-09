import '@reach/dialog/styles.css'
import 'inter-ui'
import 'polyfills'
import 'components/analytics'

import { useWeb3React, Web3ReactProvider } from '@web3-react/core'
import { getConnectorForWallet, Wallet } from 'constants/wallet'
import usePrevious from 'hooks/usePrevious'
import { BlockNumberProvider } from 'lib/hooks/useBlockNumber'
import { MulticallUpdater } from 'lib/state/multicall'
import { StrictMode, useEffect, useReducer } from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { HashRouter } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { setWalletOverride } from 'state/user/reducer'

import Blocklist from './components/Blocklist'
import { coinbaseWallet, connectors, injected, network, walletConnect } from './connectors'
import { LanguageProvider } from './i18n'
import App from './pages/App'
import * as serviceWorkerRegistration from './serviceWorkerRegistration'
import store from './state'
import ApplicationUpdater from './state/application/updater'
import ListsUpdater from './state/lists/updater'
import LogsUpdater from './state/logs/updater'
import TransactionUpdater from './state/transactions/updater'
import UserUpdater from './state/user/updater'
import ThemeProvider, { ThemedGlobalStyle } from './theme'
import RadialGradientByChainUpdater from './theme/RadialGradientByChainUpdater'

if (!!window.ethereum) {
  window.ethereum.autoRefreshOnNetworkChange = false
}

interface ConnectorState {
  isActive: boolean
  previousIsActive: boolean | undefined
  isActivating: boolean
  previousIsActivating: boolean | undefined
  isEagerlyConnecting: boolean
  setIsEagerlyConnecting(connecting: boolean): void
}

function Updaters() {
  return (
    <>
      <RadialGradientByChainUpdater />
      <ListsUpdater />
      <UserUpdater />
      <ApplicationUpdater />
      <TransactionUpdater />
      <MulticallUpdater />
      <LogsUpdater />
    </>
  )
}

const Web3Wrapper = () => {
  const dispatch = useAppDispatch()
  const { hooks } = useWeb3React()
  const walletOverrideBackfilled = useAppSelector((state) => state.user.walletOverrideBackfilled)

  const injectedIsActive = hooks.useSelectedIsActive(injected)
  const coinbaseWalletIsActive = hooks.useSelectedIsActive(coinbaseWallet)
  const walletConnectIsActive = hooks.useSelectedIsActive(walletConnect)

  const previousInjectedIsActive = usePrevious(injectedIsActive)
  const previousCoinbaseWalletIsActive = usePrevious(coinbaseWalletIsActive)
  const previousWalletConnectIsActive = usePrevious(walletConnectIsActive)

  const injectedIsActivating = hooks.useSelectedIsActivating(injected)
  const coinbaseWalletIsActivating = hooks.useSelectedIsActivating(coinbaseWallet)
  const walletConnectIsActivating = hooks.useSelectedIsActivating(walletConnect)

  const previousInjectedIsActivating = usePrevious(injectedIsActivating)
  const previousCoinbaseWalletIsActivating = usePrevious(coinbaseWalletIsActivating)
  const previousWalletConnectIsActivating = usePrevious(walletConnectIsActivating)

  const [isInjectedEagerlyConnecting, setIsInjectedEagerlyConnecting] = useReducer(
    (_state: boolean, action: boolean) => action,
    false
  )
  const [isCoinbaseWalletEagerlyConnecting, setIsCoinbaseWalletEagerlyConnecting] = useReducer(
    (_state: boolean, action: boolean) => action,
    false
  )
  const [isWalletConnectEagerlyConnecting, setIsWalletConnectEagerlyConnecting] = useReducer(
    (_state: boolean, action: boolean) => action,
    false
  )

  useEffect(() => {
    const injectedState: ConnectorState = {
      isActive: injectedIsActive,
      previousIsActive: previousInjectedIsActive,
      isActivating: injectedIsActivating,
      previousIsActivating: previousInjectedIsActivating,
      isEagerlyConnecting: isInjectedEagerlyConnecting,
      setIsEagerlyConnecting: setIsInjectedEagerlyConnecting,
    }
    const coinbaseWalletState: ConnectorState = {
      isActive: coinbaseWalletIsActive,
      previousIsActive: previousCoinbaseWalletIsActive,
      isActivating: coinbaseWalletIsActivating,
      previousIsActivating: previousCoinbaseWalletIsActivating,
      isEagerlyConnecting: isCoinbaseWalletEagerlyConnecting,
      setIsEagerlyConnecting: setIsCoinbaseWalletEagerlyConnecting,
    }
    const walletConnectState: ConnectorState = {
      isActive: walletConnectIsActive,
      previousIsActive: previousWalletConnectIsActive,
      isActivating: walletConnectIsActivating,
      previousIsActivating: previousWalletConnectIsActivating,
      isEagerlyConnecting: isWalletConnectEagerlyConnecting,
      setIsEagerlyConnecting: setIsWalletConnectEagerlyConnecting,
    }
    const isActiveMap = new Map<Wallet, ConnectorState>([
      [Wallet.INJECTED, injectedState],
      [Wallet.COINBASE_WALLET, coinbaseWalletState],
      [Wallet.WALLET_CONNECT, walletConnectState],
    ])

    isActiveMap.forEach((state: ConnectorState, wallet: Wallet) => {
      const {
        isActive,
        previousIsActive,
        isActivating,
        previousIsActivating,
        isEagerlyConnecting,
        setIsEagerlyConnecting,
      } = state

      if (!isActivating && previousIsActivating) {
        setIsEagerlyConnecting(false)
      }

      if (isActive === false && previousIsActive === undefined && isActivating) {
        setIsEagerlyConnecting(true)
      }

      if (isActive && previousIsActive === false) {
        if (isEagerlyConnecting) {
          setIsEagerlyConnecting(false)
          if (!walletOverrideBackfilled) {
            dispatch(setWalletOverride({ wallet }))
          }
        } else {
          dispatch(setWalletOverride({ wallet }))
        }
      }
    })
  }, [
    dispatch,
    walletOverrideBackfilled,
    injectedIsActive,
    coinbaseWalletIsActive,
    walletConnectIsActive,
    previousInjectedIsActive,
    previousCoinbaseWalletIsActive,
    previousWalletConnectIsActive,
    injectedIsActivating,
    coinbaseWalletIsActivating,
    walletConnectIsActivating,
    previousInjectedIsActivating,
    previousCoinbaseWalletIsActivating,
    previousWalletConnectIsActivating,
    isInjectedEagerlyConnecting,
    isCoinbaseWalletEagerlyConnecting,
    isWalletConnectEagerlyConnecting,
    setIsInjectedEagerlyConnecting,
    setIsCoinbaseWalletEagerlyConnecting,
    setIsWalletConnectEagerlyConnecting,
  ])

  return (
    <Blocklist>
      <BlockNumberProvider>
        <Updaters />
        <ThemeProvider>
          <ThemedGlobalStyle />
          <App />
        </ThemeProvider>
      </BlockNumberProvider>
    </Blocklist>
  )
}

const ReduxWrapper = () => {
  const walletOverride = useAppSelector((state) => state.user.walletOverride)
  const connectorOverride = walletOverride ? getConnectorForWallet(walletOverride) : network
  return (
    <HashRouter>
      <LanguageProvider>
        <Web3ReactProvider connectors={connectors} connectorOverride={connectorOverride}>
          <Web3Wrapper />
        </Web3ReactProvider>
      </LanguageProvider>
    </HashRouter>
  )
}

ReactDOM.render(
  <StrictMode>
    <Provider store={store}>
      <ReduxWrapper />
    </Provider>
  </StrictMode>,
  document.getElementById('root')
)

if (process.env.REACT_APP_SERVICE_WORKER !== 'false') {
  serviceWorkerRegistration.register()
}

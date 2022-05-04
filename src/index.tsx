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
import { coinbaseWallet, connectors, injected, walletConnect } from './connectors'
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

const Wrapper2 = () => {
  const dispatch = useAppDispatch()
  const { hooks } = useWeb3React()

  const injectedIsActive = hooks.useSelectedIsActive(injected)
  const coinbaseWalletIsActive = hooks.useSelectedIsActive(coinbaseWallet)
  const walletConnectIsActive = hooks.useSelectedIsActive(walletConnect)

  const injectedIsActivating = hooks.useSelectedIsActivating(injected)
  const coinbaseWalletIsActivating = hooks.useSelectedIsActivating(coinbaseWallet)
  const walletConnectIsActivating = hooks.useSelectedIsActivating(walletConnect)

  const previousInjectedIsActive = usePrevious(injectedIsActive)
  const previousCoinbaseWalletIsActive = usePrevious(coinbaseWalletIsActive)
  const previousWalletConnectIsActive = usePrevious(walletConnectIsActive)

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
      isEagerlyConnecting: isInjectedEagerlyConnecting,
      setIsEagerlyConnecting: setIsInjectedEagerlyConnecting,
    }
    const coinbaseWalletState: ConnectorState = {
      isActive: coinbaseWalletIsActive,
      previousIsActive: previousCoinbaseWalletIsActive,
      isActivating: coinbaseWalletIsActivating,
      isEagerlyConnecting: isCoinbaseWalletEagerlyConnecting,
      setIsEagerlyConnecting: setIsCoinbaseWalletEagerlyConnecting,
    }
    const walletConnectState: ConnectorState = {
      isActive: walletConnectIsActive,
      previousIsActive: previousWalletConnectIsActive,
      isActivating: walletConnectIsActivating,
      isEagerlyConnecting: isWalletConnectEagerlyConnecting,
      setIsEagerlyConnecting: setIsWalletConnectEagerlyConnecting,
    }
    const isActiveMap = new Map<Wallet, ConnectorState>([
      [Wallet.INJECTED, injectedState],
      [Wallet.COINBASE_WALLET, coinbaseWalletState],
      [Wallet.WALLET_CONNECT, walletConnectState],
    ])

    isActiveMap.forEach((state: ConnectorState, wallet: Wallet) => {
      const { isActive, previousIsActive, isActivating, isEagerlyConnecting, setIsEagerlyConnecting } = state

      if (isActive === false && previousIsActive === undefined && isActivating) {
        setIsEagerlyConnecting(true)
      }

      if (isActive && previousIsActive === false) {
        if (isEagerlyConnecting) {
          setIsEagerlyConnecting(false)
        } else {
          dispatch(setWalletOverride({ wallet }))
        }
      }
    })
  }, [
    dispatch,
    injectedIsActive,
    coinbaseWalletIsActive,
    walletConnectIsActive,
    previousInjectedIsActive,
    previousCoinbaseWalletIsActive,
    previousWalletConnectIsActive,
    injectedIsActivating,
    coinbaseWalletIsActivating,
    walletConnectIsActivating,
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

const Wrapper = () => {
  const walletOverride = useAppSelector((state) => state.user.walletOverride)
  const connectorOverride = walletOverride ? getConnectorForWallet(walletOverride) : undefined
  return (
    <HashRouter>
      <LanguageProvider>
        <Web3ReactProvider connectors={connectors} connectorOverride={connectorOverride}>
          <Wrapper2 />
        </Web3ReactProvider>
      </LanguageProvider>
    </HashRouter>
  )
}

ReactDOM.render(
  <StrictMode>
    <Provider store={store}>
      <Wrapper />
    </Provider>
  </StrictMode>,
  document.getElementById('root')
)

if (process.env.REACT_APP_SERVICE_WORKER !== 'false') {
  serviceWorkerRegistration.register()
}

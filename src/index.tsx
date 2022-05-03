import '@reach/dialog/styles.css'
import 'inter-ui'
import 'polyfills'
import 'components/analytics'

import { Web3ReactProvider } from '@web3-react/core'
import { getConnectorForWallet } from 'constants/wallet'
import useWeb3ReactListener from 'hooks/useWeb3ReactListener'
import { BlockNumberProvider } from 'lib/hooks/useBlockNumber'
import { MulticallUpdater } from 'lib/state/multicall'
import { StrictMode } from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { HashRouter } from 'react-router-dom'
import { useAppSelector } from 'state/hooks'

import Blocklist from './components/Blocklist'
import { connectors } from './connectors'
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
  useWeb3ReactListener()
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

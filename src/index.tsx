import 'inter-ui'
import '@reach/dialog/styles.css'

import * as serviceWorkerRegistration from './serviceWorkerRegistration'

import { StrictMode, useEffect } from 'react'
import ThemeProvider, { ThemedGlobalStyle } from './theme'
import { Web3ReactProvider, createWeb3ReactRoot, useWeb3React } from '@web3-react/core'

import App from './pages/App'
import ApplicationUpdater from './state/application/updater'
import Blocklist from './components/Blocklist'
import { HashRouter } from 'react-router-dom'
import { LanguageProvider } from './i18n'
import ListsUpdater from './state/lists/updater'
import LogsUpdater from './state/logs/updater'
import { MulticallUpdater } from 'state/multicall/multicall'
import { NetworkContextName } from './constants/misc'
import { Provider } from 'react-redux'
import RadialGradientByChainUpdater from './theme/RadialGradientByChainUpdater'
import ReactDOM from 'react-dom'
import ReactGA from 'react-ga'
import TransactionUpdater from './state/transactions/updater'
import UserUpdater from './state/user/updater'
import getLibrary from './utils/getLibrary'
import { isMobile } from 'react-device-detect'
import store from './state'

const Web3ProviderNetwork = createWeb3ReactRoot(NetworkContextName)

if (!!window.ethereum) {
  window.ethereum.autoRefreshOnNetworkChange = false
}
const GOOGLE_ANALYTICS_ID: string | undefined = 'UA-214677231-2'
if (typeof GOOGLE_ANALYTICS_ID === 'string') {
  const testMode = process.env.NODE_ENV == 'development';
  const debug = true

  ReactGA.initialize(GOOGLE_ANALYTICS_ID, {
    testMode,
    debug,
    titleCase: false,
    gaOptions: {
      storeGac: false,
      alwaysSendReferrer: true 
    },
  })
  
  ReactGA.set({
    anonymizeIp: true,
    customBrowserType: !isMobile
      ? 'desktop'
      : 'web3' in window || 'ethereum' in window
      ? 'mobileWeb3'
      : 'mobileRegular',
  })
} else {
  ReactGA.initialize('test', { testMode: true, debug: true })
}

function Updaters() {
  const { account } = useWeb3React();
  useEffect(() => {
    console.log(`Set Analytics    Account: ${account}`)
    if (account) ReactGA.set({userId: account});
  }, [account])
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

ReactDOM.render(
  
    <Provider store={store}>
      <HashRouter>
        <LanguageProvider>
          <Web3ReactProvider getLibrary={getLibrary}>
            <Web3ProviderNetwork getLibrary={getLibrary}>
              <Blocklist>
                <Updaters />
                <ThemeProvider>
                  <ThemedGlobalStyle />
                  <App />
                </ThemeProvider>
              </Blocklist>
            </Web3ProviderNetwork>
          </Web3ReactProvider>
        </LanguageProvider>
      </HashRouter>
    </Provider>,
  document.getElementById('root')
)

serviceWorkerRegistration.unregister()

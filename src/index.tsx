import { createWeb3ReactRoot, Web3ReactProvider } from '@web3-react/core'
import 'inter-ui'
import React, { StrictMode, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { NetworkContextName, sentryRequestId } from './constants'
import * as serviceWorkerRegistration from './serviceWorkerRegistration'
import { LanguageProvider } from './i18n'
import App from './pages/App'
import store from './state'
import ApplicationUpdater from './state/application/updater'
import ListsUpdater from './state/lists/updater'
import MulticallUpdater from './state/multicall/updater'
import TransactionUpdater from './state/transactions/updater'
import UserUpdater from './state/user/updater'
import CampaignsUpdater from 'state/campaigns/updater'
import ThemeProvider, { FixedGlobalStyle, ThemedGlobalStyle } from './theme'
import getLibrary from './utils/getLibrary'
import SEO from './components/SEO'
import TagManager from 'react-gtm-module'
import * as Sentry from '@sentry/react'
import 'swiper/swiper-bundle.min.css'
import 'swiper/swiper.min.css'
import AOS from 'aos'
import 'aos/dist/aos.css' // You can also use <link> for styles

AOS.init()

const Web3ProviderNetwork = createWeb3ReactRoot(NetworkContextName)

window.version = process.env.REACT_APP_VERSION

if ('ethereum' in window) {
  ;(window.ethereum as any).autoRefreshOnNetworkChange = false
}

function Updaters() {
  return (
    <>
      <ListsUpdater />
      <UserUpdater />
      <ApplicationUpdater />
      <TransactionUpdater />
      <MulticallUpdater />
      <CampaignsUpdater />
    </>
  )
}

if (process.env.REACT_APP_GTM_ID) {
  const tagManagerArgs = {
    gtmId: process.env.REACT_APP_GTM_ID,
  }

  TagManager.initialize(tagManagerArgs)
}

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DNS,
  environment: window.location.href.includes('kyberswap') ? 'production' : 'development',
})
Sentry.configureScope(scope => {
  scope.setTag('request_id', sentryRequestId)
})

const preloadhtml = document.querySelector('.preloadhtml')
const preloadhtmlStyle = document.querySelector('.preloadhtml-style')
const hideLoader = () => {
  setTimeout(() => {
    preloadhtml?.remove()
    preloadhtmlStyle?.remove()
  }, 100)
}

const ReactApp = ({ hideLoader }: { hideLoader: () => void }) => {
  useEffect(hideLoader, [])

  return (
    <StrictMode>
      <SEO
        title="KyberSwap - Swap and earn tokens at the best rates"
        description="KyberSwap is DeFi‚Äôs first Dynamic Market Maker; a decentralized exchange protocol that provides frictionless crypto liquidity with extremely high flexibility and capital efficiency. KyberSwap is the first major protocol in Kyber‚Äôs liquidity hub."
      />
      <FixedGlobalStyle />
      <Provider store={store}>
        <BrowserRouter>
          <LanguageProvider>
            <Web3ReactProvider getLibrary={getLibrary}>
              <Web3ProviderNetwork getLibrary={getLibrary}>
                <Updaters />
                <ThemeProvider>
                  <ThemedGlobalStyle />
                  <App />
                </ThemeProvider>
              </Web3ProviderNetwork>
            </Web3ReactProvider>
          </LanguageProvider>
        </BrowserRouter>
      </Provider>
    </StrictMode>
  )
}

ReactDOM.render(<ReactApp hideLoader={hideLoader} />, document.getElementById('root'))

// if (process.env.REACT_APP_SERVICE_WORKER === 'true') {
//   serviceWorkerRegistration.register()
// } else {
//   serviceWorkerRegistration.unregister()
// }
serviceWorkerRegistration.unregister()

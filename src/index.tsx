import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'
import { Web3ReactProvider, createWeb3ReactRoot } from '@web3-react/core'
import AOS from 'aos'
import 'aos/dist/aos.css'
import 'inter-ui'
import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import TagManager from 'react-gtm-module'
import 'react-loading-skeleton/dist/skeleton.css'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import 'swiper/swiper-bundle.min.css'
import 'swiper/swiper.min.css'

import CampaignsUpdater from 'state/campaigns/updater'

import SEO from './components/SEO'
import { NetworkContextName, sentryRequestId } from './constants'
import { LanguageProvider } from './i18n'
import App from './pages/App'
import * as serviceWorkerRegistration from './serviceWorkerRegistration'
import store from './state'
import ApplicationUpdater from './state/application/updater'
import CustomizeDexesUpdater from './state/customizeDexes/updater'
import ListsUpdater from './state/lists/updater'
import MulticallUpdater from './state/multicall/updater'
import TransactionUpdater from './state/transactions/updater'
import UserUpdater from './state/user/updater'
import ThemeProvider, { FixedGlobalStyle, ThemedGlobalStyle } from './theme'
import getLibrary from './utils/getLibrary'

AOS.init()

const Web3ProviderNetwork = createWeb3ReactRoot(NetworkContextName)

window.tag = process.env.REACT_APP_TAG

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
      <CustomizeDexesUpdater />
    </>
  )
}

if (process.env.REACT_APP_GTM_ID) {
  const tagManagerArgs = {
    gtmId: process.env.REACT_APP_GTM_ID,
  }

  TagManager.initialize(tagManagerArgs)
}

if (window.location.href.includes('kyberswap.com')) {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DNS,
    environment: 'production',
    ignoreErrors: ['AbortError'],
    integrations: [new BrowserTracing()],
    tracesSampleRate: 0.1,
  })

  Sentry.configureScope(scope => {
    scope.setTag('request_id', sentryRequestId)
    scope.setTag('version', process.env.REACT_APP_TAG)
  })
}

const preloadhtml = document.querySelector('.preloadhtml')
const preloadhtmlStyle = document.querySelector('.preloadhtml-style')

const hideLoader = () => {
  setTimeout(() => {
    preloadhtml?.remove()
    preloadhtmlStyle?.remove()
  }, 100)
}

const ReactApp = () => {
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

const container = document.getElementById('app') as HTMLElement
const root = createRoot(container)
root.render(<ReactApp />)

// if (process.env.REACT_APP_SERVICE_WORKER === 'true') {
//   serviceWorkerRegistration.register()
// } else {
//   serviceWorkerRegistration.unregister()
// }
serviceWorkerRegistration.unregister()

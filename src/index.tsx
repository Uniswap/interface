import './i18n'
import '@celo-tools/use-contractkit/lib/styles.css'
import './index.css'

import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client'
import { CeloMainnet, ContractKitProvider } from '@celo-tools/use-contractkit'
import * as Sentry from '@sentry/react'
import { Integrations } from '@sentry/tracing'
import { ChainId } from '@ubeswap/sdk'
import { NETWORK_CHAIN_ID, NETWORK_CHAIN_NAME } from 'connectors/index'
import React, { StrictMode } from 'react'
import { isMobile } from 'react-device-detect'
import ReactDOM from 'react-dom'
import ReactGA from 'react-ga'
import { Provider } from 'react-redux'
import { HashRouter } from 'react-router-dom'

import App from './pages/App'
import store from './state'
import ApplicationUpdater from './state/application/updater'
import ListsUpdater from './state/lists/updater'
import MulticallUpdater from './state/multicall/updater'
import TransactionUpdater from './state/transactions/updater'
import UserUpdater from './state/user/updater'
import ThemeProvider, { FixedGlobalStyle, ThemedGlobalStyle } from './theme'

if (window.celo) {
  window.celo.autoRefreshOnNetworkChange = false
}

const client = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/ubeswap/ubeswap',
  cache: new InMemoryCache(),
})

const GOOGLE_ANALYTICS_IDS = {
  production: {
    [ChainId.MAINNET]: 'UA-189817928-4',
    [ChainId.ALFAJORES]: 'UA-189817928-5',
    [ChainId.BAKLAVA]: 'UA-189817928-6',
  },
  staging: {
    [ChainId.MAINNET]: 'UA-189817928-2',
    [ChainId.ALFAJORES]: 'UA-189817928-3',
    [ChainId.BAKLAVA]: 'UA-189817928-7',
  },
}

const environment = window.location.hostname.includes('app-staging')
  ? 'staging'
  : window.location.hostname.includes('ubeswap.org')
  ? 'production'
  : process.env.REACT_APP_VERCEL_ENV ?? null

// google analytics
const analyticsEnv: 'staging' | 'production' | null = environment
  ? environment in GOOGLE_ANALYTICS_IDS
    ? (environment as keyof typeof GOOGLE_ANALYTICS_IDS)
    : 'staging'
  : null
const GOOGLE_ANALYTICS_ID = analyticsEnv ? GOOGLE_ANALYTICS_IDS[analyticsEnv][NETWORK_CHAIN_ID] : null
if (GOOGLE_ANALYTICS_ID) {
  console.log(`Initializing GA at ${GOOGLE_ANALYTICS_ID} (${analyticsEnv} ${NETWORK_CHAIN_NAME})`)
  ReactGA.initialize(GOOGLE_ANALYTICS_ID)
  ReactGA.set({
    customBrowserType: !isMobile ? 'desktop' : 'web3' in window || 'celo' in window ? 'mobileWeb3' : 'mobileRegular',
  })
} else {
  console.log(`Could not initialize GA (${analyticsEnv} ${NETWORK_CHAIN_NAME})`)
  ReactGA.initialize('test', { testMode: true, debug: true })
}

if (process.env.REACT_APP_SENTRY_DSN) {
  const sentryCfg = {
    environment: `${process.env.REACT_APP_VERCEL_ENV ?? 'unknown'}`,
    release: `${process.env.REACT_APP_VERCEL_GIT_COMMIT_REF?.replace(/\//g, '--') ?? 'unknown'}-${
      process.env.REACT_APP_VERCEL_GIT_COMMIT_SHA ?? 'unknown'
    }`,
  }
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    integrations: [new Integrations.BrowserTracing()],
    tracesSampleRate: 0.2,
    ...sentryCfg,
  })
  console.log(`Initializing Sentry environment at release ${sentryCfg.release} in environment ${sentryCfg.environment}`)
} else {
  console.warn(`REACT_APP_SENTRY_DSN not found. Sentry will not be loaded.`)
}

// react GA error tracking
window.addEventListener('error', (error) => {
  ReactGA.exception({
    description: `${error.message} @ ${error.filename}:${error.lineno}:${error.colno}`,
    fatal: true,
  })
})

function Updaters() {
  return (
    <>
      <ListsUpdater />
      <UserUpdater />
      <ApplicationUpdater />
      <TransactionUpdater />
      <MulticallUpdater />
    </>
  )
}

ReactDOM.render(
  <StrictMode>
    <FixedGlobalStyle />
    <ContractKitProvider
      dapp={{
        name: 'Ubeswap',
        description:
          'The interface for Ubeswap, a decentralized exchange and automated market maker protocol for Celo assets.',
        url: 'https://app.ubeswap.org',
        icon: 'https://info.ubeswap.org/favicon.png',
      }}
      network={CeloMainnet}
      connectModal={{
        reactModalProps: {
          style: {
            content: {
              top: '50%',
              left: '50%',
              right: 'auto',
              bottom: 'auto',
              transform: 'translate(-50%, -50%)',
              border: 'unset',
              background: 'unset',
              padding: 'unset',
              color: 'black',
            },
            overlay: {
              zIndex: 100,
            },
          },
          overlayClassName: 'tw-fixed tw-bg-gray-100 dark:tw-bg-gray-700 tw-bg-opacity-75 tw-inset-0',
        },
      }}
    >
      <Provider store={store}>
        <ApolloProvider client={client}>
          <Updaters />
          <ThemeProvider>
            <ThemedGlobalStyle />
            <HashRouter>
              <App />
            </HashRouter>
          </ThemeProvider>
        </ApolloProvider>
      </Provider>
    </ContractKitProvider>
  </StrictMode>,
  document.getElementById('root')
)

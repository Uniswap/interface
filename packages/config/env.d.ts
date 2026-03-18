/** biome-ignore-all lint/style/noNamespace: required to define process.env type */

declare global {
  namespace NodeJS {
    // All process.env values used by this package should be listed here
    interface ProcessEnv {
      NODE_ENV?: 'development' | 'production' | 'test'
      ALCHEMY_API_KEY?: string
      AMPLITUDE_PROXY_URL_OVERRIDE?: string
      API_BASE_URL_OVERRIDE?: string
      API_BASE_URL_V2_OVERRIDE?: string
      APPSFLYER_API_KEY?: string
      APPSFLYER_APP_ID?: string
      BLOCKAID_PROXY_URL?: string
      CI?: string
      DATADOG_CLIENT_TOKEN?: string
      DATADOG_PROJECT_ID?: string
      ENABLE_ENTRY_GATEWAY_PROXY?: string
      ENABLE_SESSION_SERVICE?: string
      ENABLE_SESSION_UPGRADE_AUTO?: string
      ENTRY_GATEWAY_API_URL_OVERRIDE?: string
      FOR_API_URL_OVERRIDE?: string
      GRAPHQL_URL_OVERRIDE?: string
      INCLUDE_PROTOTYPE_FEATURES?: string
      IS_E2E_TEST?: string
      JUPITER_PROXY_URL?: string
      LIQUIDITY_SERVICE_URL_OVERRIDE?: string
      ONESIGNAL_APP_ID?: string
      QUICKNODE_ENDPOINT_NAME?: string
      QUICKNODE_ENDPOINT_TOKEN?: string
      REACT_APP_ALCHEMY_API_KEY?: string
      REACT_APP_BLOCKAID_PROXY_URL?: string
      REACT_APP_DATADOG_CLIENT_TOKEN?: string
      REACT_APP_DATADOG_PROJECT_ID?: string
      REACT_APP_ENABLE_SESSION_UPGRADE_AUTO?: string
      REACT_APP_INFURA_KEY?: string
      REACT_APP_JUPITER_PROXY_URL?: string
      REACT_APP_LIQUIDITY_SERVICE_URL_OVERRIDE?: string
      REACT_APP_QUICKNODE_ENDPOINT_NAME?: string
      REACT_APP_QUICKNODE_ENDPOINT_TOKEN?: string
      REACT_APP_STATSIG_API_KEY?: string
      REACT_APP_TRADING_API_KEY?: string
      REACT_APP_TRADING_API_TEST_ENV?: string
      REACT_APP_TRADING_API_URL_OVERRIDE?: string
      REACT_APP_WALLET_CONNECT_PROJECT_ID?: string
      SCANTASTIC_API_URL_OVERRIDE?: string
      STATSIG_API_KEY?: string
      STATSIG_PROXY_URL_OVERRIDE?: string
      TRADING_API_KEY?: string
      TRADING_API_URL_OVERRIDE?: string
      UNISWAP_API_KEY?: string
      UNISWAP_NOTIF_API_BASE_URL_OVERRIDE?: string
      UNITAGS_API_URL_OVERRIDE?: string
      VERSION?: string
      VERCEL?: string
      VITE_ENABLE_ENTRY_GATEWAY_PROXY?: string
      WALLETCONNECT_PROJECT_ID?: string
      WALLETCONNECT_PROJECT_ID_BETA?: string
      WALLETCONNECT_PROJECT_ID_DEV?: string
    }
  }
}

export {}

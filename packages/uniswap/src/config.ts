// eslint-disable-next-line no-restricted-imports
import {
  APPSFLYER_API_KEY,
  APPSFLYER_APP_ID,
  FIREBASE_APP_CHECK_DEBUG_TOKEN,
  INFURA_KEY,
  INFURA_PROJECT_ID,
  MOONPAY_API_KEY,
  MOONPAY_API_URL,
  MOONPAY_WIDGET_API_URL,
  ONESIGNAL_APP_ID,
  QUICKNODE_ARBITRUM_RPC_URL,
  QUICKNODE_BNB_RPC_URL,
  QUICKNODE_MAINNET_RPC_URL,
  QUICKNODE_ZORA_RPC_URL,
  SENTRY_DSN,
  SIMPLEHASH_API_KEY,
  SIMPLEHASH_API_URL,
  STATSIG_PROXY_URL,
  TRADING_API_KEY,
  UNISWAP_API_KEY,
  WALLETCONNECT_PROJECT_ID,
} from "react-native-dotenv";
import { isNonJestDev } from "utilities/src/environment";

export interface Config {
  appsflyerApiKey: string;
  appsflyerAppId: string;
  moonpayApiKey: string;
  moonpayApiUrl: string;
  moonpayWidgetApiUrl: string;
  uniswapApiKey: string;
  infuraKey: string;
  infuraProjectId: string;
  onesignalAppId: string;
  sentryDsn: string;
  simpleHashApiKey: string;
  simpleHashApiUrl: string;
  statSigProxyUrl: string;
  walletConnectProjectId: string;
  quicknodeArbitrumRpcUrl: string;
  quicknodeBnbRpcUrl: string;
  quicknodeZoraRpcUrl: string;
  quicknodeZkSyncRpcUrl: string;
  quicknodeMainnetRpcUrl: string;
  tradingApiKey: string;
  firebaseAppCheckDebugToken: string;
}

const _config: Config = {
  appsflyerApiKey: process.env.APPSFLYER_API_KEY || APPSFLYER_API_KEY,
  appsflyerAppId: process.env.APPSFLYER_APP_ID || APPSFLYER_APP_ID,
  moonpayApiKey:
    process.env.REACT_APP_MOONPAY_PUBLISHABLE_KEY ||
    process.env.MOONPAY_API_KEY ||
    MOONPAY_API_KEY,
  moonpayApiUrl:
    process.env.REACT_APP_MOONPAY_API ||
    process.env.MOONPAY_API_URL ||
    MOONPAY_API_URL,
  moonpayWidgetApiUrl:
    process.env.MOONPAY_WIDGET_API_URL || MOONPAY_WIDGET_API_URL,
  uniswapApiKey: process.env.UNISWAP_API_KEY || UNISWAP_API_KEY,
  infuraKey: process.env.REACT_APP_INFURA_KEY || INFURA_KEY,
  infuraProjectId: process.env.INFURA_PROJECT_ID || INFURA_PROJECT_ID,
  onesignalAppId: process.env.ONESIGNAL_APP_ID || ONESIGNAL_APP_ID,
  sentryDsn:
    process.env.REACT_APP_SENTRY_DSN ||
    process.env.SENTRY_DSN ||
    SENTRY_DSN ||
    "",
  simpleHashApiKey: process.env.SIMPLEHASH_API_KEY || SIMPLEHASH_API_KEY,
  simpleHashApiUrl: process.env.SIMPLEHASH_API_URL || SIMPLEHASH_API_URL,
  statSigProxyUrl:
    process.env.REACT_APP_STATSIG_PROXY_URL ||
    process.env.STATSIG_PROXY_URL ||
    STATSIG_PROXY_URL,
  walletConnectProjectId:
    process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID ||
    process.env.WALLETCONNECT_PROJECT_ID ||
    WALLETCONNECT_PROJECT_ID,
  quicknodeArbitrumRpcUrl:
    process.env.REACT_APP_QUICKNODE_ARBITRUM_RPC_URL ||
    QUICKNODE_ARBITRUM_RPC_URL,
  quicknodeBnbRpcUrl:
    process.env.QUICKNODE_BNB_RPC_URL || QUICKNODE_BNB_RPC_URL,
  quicknodeZoraRpcUrl:
    process.env.QUICKNODE_ZORA_RPC_URL || QUICKNODE_ZORA_RPC_URL,
  quicknodeZkSyncRpcUrl: process.env.QUICKNODE_ZKSYNC_RPC_URL || "",
  quicknodeMainnetRpcUrl:
    process.env.REACT_APP_QUICKNODE_MAINNET_RPC_URL ||
    QUICKNODE_MAINNET_RPC_URL,
  tradingApiKey: process.env.TRADING_API_KEY || TRADING_API_KEY,
  firebaseAppCheckDebugToken:
    process.env.FIREBASE_APP_CHECK_DEBUG_TOKEN ||
    FIREBASE_APP_CHECK_DEBUG_TOKEN,
};

export const config = Object.freeze(_config);

if (isNonJestDev) {
  // Cannot use logger here, causes error from circular dep
  // eslint-disable-next-line no-console
  console.debug("Using app config:", config);
}

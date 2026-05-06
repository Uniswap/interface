import { boolFromOne, boolFromString, optionalString } from '@universe/config/src/commonSchemas'
import { z } from 'zod'

/**
 * Raw process.env values for the base config.
 *
 * Each field is a literal process.env.X reference. The direct references are
 * required because Vite replaces them with static values at build time —
 * dynamic access like process.env[key] does not work in production builds.
 */
export const BaseConfigValues = {
  // Environment
  nodeEnv: process.env.NODE_ENV,
  environment: process.env.ENVIRONMENT ?? process.env.NODE_ENV,
  isE2ETest: process.env.IS_E2E_TEST,
  isVercelEnvironment: process.env.VERCEL,

  // API Keys
  alchemyApiKey: process.env.ALCHEMY_API_KEY ?? process.env.REACT_APP_ALCHEMY_API_KEY,
  datadogClientToken: process.env.DATADOG_CLIENT_TOKEN ?? process.env.REACT_APP_DATADOG_CLIENT_TOKEN,
  datadogProjectId: process.env.DATADOG_PROJECT_ID ?? process.env.REACT_APP_DATADOG_PROJECT_ID,
  infuraKey: process.env.INFURA_KEY ?? process.env.REACT_APP_INFURA_KEY,
  statsigApiKey: process.env.STATSIG_API_KEY ?? process.env.REACT_APP_STATSIG_API_KEY,
  tradingApiKey: process.env.TRADING_API_KEY ?? process.env.REACT_APP_TRADING_API_KEY,
  uniswapApiKey: process.env.UNISWAP_API_KEY,
  walletConnectProjectId: process.env.WALLETCONNECT_PROJECT_ID ?? process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID,
  walletConnectProjectIdBeta: process.env.WALLETCONNECT_PROJECT_ID_BETA,
  walletConnectProjectIdDev: process.env.WALLETCONNECT_PROJECT_ID_DEV,

  // External Service URLs
  blockaidProxyUrl: process.env.BLOCKAID_PROXY_URL ?? process.env.REACT_APP_BLOCKAID_PROXY_URL,
  jupiterProxyUrl: process.env.JUPITER_PROXY_URL ?? process.env.REACT_APP_JUPITER_PROXY_URL,
  quicknodeEndpointName: process.env.QUICKNODE_ENDPOINT_NAME ?? process.env.REACT_APP_QUICKNODE_ENDPOINT_NAME,
  quicknodeEndpointToken: process.env.QUICKNODE_ENDPOINT_TOKEN ?? process.env.REACT_APP_QUICKNODE_ENDPOINT_TOKEN,

  // Feature Flags
  enableEntryGatewayProxy: process.env.VITE_ENABLE_ENTRY_GATEWAY_PROXY ?? process.env.ENABLE_ENTRY_GATEWAY_PROXY,
  enableSessionService: process.env.ENABLE_SESSION_SERVICE,
  enableSessionUpgradeAuto:
    process.env.ENABLE_SESSION_UPGRADE_AUTO ?? process.env.REACT_APP_ENABLE_SESSION_UPGRADE_AUTO,
  includePrototypeFeatures: process.env.INCLUDE_PROTOTYPE_FEATURES,

  // URL Overrides
  amplitudeProxyUrlOverride: process.env.AMPLITUDE_PROXY_URL_OVERRIDE,
  apiBaseUrlOverride: process.env.API_BASE_URL_OVERRIDE,
  apiBaseUrlV2Override: process.env.API_BASE_URL_V2_OVERRIDE,
  entryGatewayApiUrlOverride: process.env.ENTRY_GATEWAY_API_URL_OVERRIDE,
  forApiUrlOverride: process.env.FOR_API_URL_OVERRIDE,
  graphqlUrlOverride: process.env.GRAPHQL_URL_OVERRIDE,
  liquidityServiceUrlOverride:
    process.env.LIQUIDITY_SERVICE_URL_OVERRIDE ?? process.env.REACT_APP_LIQUIDITY_SERVICE_URL_OVERRIDE,
  scantasticApiUrlOverride: process.env.SCANTASTIC_API_URL_OVERRIDE,
  statsigProxyUrlOverride: process.env.STATSIG_PROXY_URL_OVERRIDE,
  tradingApiUrlOverride: process.env.TRADING_API_URL_OVERRIDE ?? process.env.REACT_APP_TRADING_API_URL_OVERRIDE,
  tradingApiWebTestEnv: process.env.REACT_APP_TRADING_API_TEST_ENV,
  uniswapNotifApiBaseUrlOverride: process.env.UNISWAP_NOTIF_API_BASE_URL_OVERRIDE,
}

const envEnum = z.enum(['development', 'staging', 'production', 'test'])

/** Zod schema defining the shape and validation for base config fields */
export const BaseConfigSchema = z.object({
  // Environment
  nodeEnv: envEnum.default('development').describe('Node environment mode, defaults to development'),
  environment: envEnum.default('development').describe('App environment, defaults to NODE_ENV'),
  isE2ETest: boolFromString.describe('Is the app running in E2E test mode'),
  isVercelEnvironment: boolFromOne.describe('Is the app deployed on Vercel'),

  // API Keys
  alchemyApiKey: optionalString.describe('API key for Alchemy'),
  datadogClientToken: optionalString.describe('Client token for Datadog'),
  datadogProjectId: optionalString.describe('Project ID for Datadog'),
  infuraKey: optionalString.describe('API key for Infura'),
  statsigApiKey: optionalString.describe('Client SDK key for Statsig'),
  tradingApiKey: optionalString.describe('API key for Trading API'),
  uniswapApiKey: optionalString.describe('API key for Uniswap API'),
  walletConnectProjectId: optionalString.describe('Project ID for WalletConnect'),
  walletConnectProjectIdBeta: optionalString.describe('Project ID for WalletConnect (beta)'),
  walletConnectProjectIdDev: optionalString.describe('Project ID for WalletConnect (dev)'),

  // External Service URLs
  blockaidProxyUrl: optionalString.describe('URL for Blockaid proxy'),
  jupiterProxyUrl: optionalString.describe('URL for Jupiter proxy'),
  quicknodeEndpointName: optionalString.describe('QuickNode endpoint name'),
  quicknodeEndpointToken: optionalString.describe('QuickNode endpoint token'),

  // Feature Flags
  enableEntryGatewayProxy: boolFromString.describe('Is the entry gateway proxy enabled'),
  enableSessionService: boolFromString.describe('Is the session service enabled'),
  enableSessionUpgradeAuto: boolFromString.describe('Is automatic session upgrade enabled'),
  includePrototypeFeatures: boolFromString.describe('Are prototype features included'),

  // URL Overrides
  amplitudeProxyUrlOverride: optionalString.describe('Override URL for Amplitude proxy'),
  apiBaseUrlOverride: optionalString.describe('Override URL for API base v1'),
  apiBaseUrlV2Override: optionalString.describe('Override URL for API base v2'),
  entryGatewayApiUrlOverride: optionalString.describe('Override URL for entry gateway API'),
  forApiUrlOverride: optionalString.describe('Override URL for FOR API'),
  graphqlUrlOverride: optionalString.describe('Override URL for GraphQL'),
  liquidityServiceUrlOverride: optionalString.describe('Override URL for liquidity service'),
  scantasticApiUrlOverride: optionalString.describe('Override URL for Scantastic API'),
  statsigProxyUrlOverride: optionalString.describe('Override URL for Statsig proxy'),
  tradingApiUrlOverride: optionalString.describe('Override URL for Trading API'),
  tradingApiWebTestEnv: optionalString.describe('Trading API test environment flag'),
  uniswapNotifApiBaseUrlOverride: optionalString.describe('Override URL for notification API'),
})

/** Type inferred from BaseConfigSchema */
export type BaseConfig = z.infer<typeof BaseConfigSchema>

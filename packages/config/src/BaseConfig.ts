// oxlint-disable eslint-js/no-restricted-syntax -- allow process.env access here
import { AppId } from '@universe/config/src/AppId'
import { boolIfDefined, boolFromOne, boolFromString, optionalString } from '@universe/config/src/commonSchemas'
import { Environment, NodeEnv, normalizeEnvironmentWireValue } from '@universe/config/src/Environment'
import { z } from 'zod'

/**
 * Raw process.env values for the base config.
 *
 * Each field is a literal process.env.X reference. The direct references are
 * required because Vite replaces them with static values at build time —
 * dynamic access like process.env[key] does not work in production builds.
 */
export const BaseConfigValues = {
  // App metadata
  appId: process.env.APP_ID,
  // Note, for mobile, this is empty in this package's getConfig() result but
  // set in the app's getConfig because DeviceInfo.getVersion() is not available here.
  // When this package's getConfig() is removed, that will no longer be a concern.
  appVersion: process.env.VERSION ?? process.env.REACT_APP_VERSION_TAG,

  // Environment
  nodeEnv: process.env.NODE_ENV,
  // Falls back to NODE_ENV only when it identifies a real deployment
  // env (production); otherwise defaults to development.
  environment:
    process.env.ENVIRONMENT ??
    (process.env.NODE_ENV === NodeEnv.Production ? Environment.Production : Environment.Development),
  isUnitTest: process.env.JEST_WORKER_ID ?? process.env.VITEST_WORKER_ID,
  isE2ETest: process.env.IS_E2E_TEST,
  isVercelEnvironment: process.env.VERCEL,
  // Build-time channel for the extension (dev/beta/prod). Used to resolve the env of
  // unpacked builds whose runtime extension ID matches none of the trusted IDs.
  buildEnv: process.env.BUILD_ENV,
  // When true, a Beta build points its APIs at prod instead of staging. Set at build time
  // (e.g. by the on-demand beta workflow); unset/false keeps the default beta → staging in urls.ts.
  isBetaUsingProdApi: process.env.BETA_USES_PROD_API,

  // API Keys
  alchemyApiKey: process.env.ALCHEMY_API_KEY ?? process.env.REACT_APP_ALCHEMY_API_KEY,
  datadogClientToken: process.env.DATADOG_CLIENT_TOKEN ?? process.env.REACT_APP_DATADOG_CLIENT_TOKEN,
  datadogProjectId: process.env.DATADOG_PROJECT_ID ?? process.env.REACT_APP_DATADOG_PROJECT_ID,
  infuraKey: process.env.INFURA_KEY ?? process.env.REACT_APP_INFURA_KEY,
  privyAppId: process.env.PRIVY_APP_ID,
  privyClientId: process.env.PRIVY_CLIENT_ID,
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
  quicknodeSolanaRpcUrl: process.env.QUICKNODE_SOLANA_RPC_URL ?? process.env.REACT_APP_QUICKNODE_SOLANA_RPC_URL,

  // Feature Flags
  enableEntryGatewayProxy: process.env.ENABLE_ENTRY_GATEWAY_PROXY ?? process.env.VITE_ENABLE_ENTRY_GATEWAY_PROXY,
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
  tradingApiWebTestEnv: process.env.TRADING_API_TEST_ENV ?? process.env.REACT_APP_TRADING_API_TEST_ENV,
  uniswapNotifApiBaseUrlOverride: process.env.UNISWAP_NOTIF_API_BASE_URL_OVERRIDE,
}

/** Zod schema defining the shape and validation for base config fields */
export const BaseConfigSchema = z.object({
  // App metadata
  appId: z.enum(AppId).describe('Identifies which app this config is for'),
  appVersion: optionalString.describe('App version tag'),

  // Environment
  nodeEnv: z.enum(NodeEnv).default(NodeEnv.Development).describe('Node process runtime mode, defaults to development'),
  environment: z
    .preprocess(normalizeEnvironmentWireValue, z.enum(Environment).default(Environment.Development))
    .describe('Backend deployment environment, defaults to development; accepts deployer short forms dev/prod'),
  isUnitTest: boolIfDefined.describe('Is the app running in a unit test (Jest or Vitest)'),
  isE2ETest: boolFromString.describe('Is the app running in E2E test mode'),
  isVercelEnvironment: boolFromOne.describe('Is the app deployed on Vercel'),
  buildEnv: optionalString.describe('Build-time channel for the extension (dev/beta/prod)'),
  isBetaUsingProdApi: boolFromString.describe('For Beta builds, point APIs at prod instead of staging'),

  // API Keys
  alchemyApiKey: optionalString.describe('API key for Alchemy'),
  datadogClientToken: optionalString.describe('Client token for Datadog'),
  datadogProjectId: optionalString.describe('Project ID for Datadog'),
  infuraKey: optionalString.describe('API key for Infura'),
  privyAppId: z.string().optional().describe('App ID for Privy integration'),
  privyClientId: z.string().optional().describe('Client ID for Privy integration'),
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
  quicknodeSolanaRpcUrl: optionalString.describe(
    'Dedicated QuickNode RPC URL for Solana; overrides the built-in default until UniRPC routes Solana',
  ),

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

// oxlint-disable eslint-js/no-restricted-syntax -- allow process.env access in these config files
import type { BaseConfig } from '@universe/config'
import { AppId, boolFromString, Environment, NodeEnv, parseConfig } from '@universe/config'
import {
  getUniswapServiceUrls as getUniswapServiceUrlsFromOverrides,
  type UniswapServiceUrls,
} from 'uniswap/src/constants/urls'
import { logger } from 'utilities/src/logger/logger'
import { z } from 'zod'

/**
 * Raw process.env values for web-specific config fields.
 * Base config values are merged in automatically by parseConfig.
 */
const webConfigValues = {
  appId: AppId.Web,

  // #region API Keys

  /** Overrides base config — web requires this to be present (walletConnect.ts throws) */
  walletConnectProjectId: process.env.WALLETCONNECT_PROJECT_ID ?? process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID,

  // #endregion

  // #region Endpoint URLs

  /** AWS_API_ENDPOINT — Apollo GraphQL API */
  awsApiEndpoint: process.env.AWS_API_ENDPOINT ?? process.env.REACT_APP_AWS_API_ENDPOINT,

  /** UNISWAP_GATEWAY_DNS — gateway v2 (routing, order status, UniswapX) */
  uniswapGatewayDns: process.env.UNISWAP_GATEWAY_DNS ?? process.env.REACT_APP_UNISWAP_GATEWAY_DNS,

  /** ENTRY_GATEWAY_API_URL — BFF proxy target; falls back to staging URL */
  // TODO(apps-infra): Clarify difference between entryGatewayApiUrl (server-side) and entryGatewayApiUrlOverride (BaseConfig)
  entryGatewayApiUrl: process.env.ENTRY_GATEWAY_API_URL,

  /** WEBSOCKET_URL — WebSocket proxy target; falls back to staging URL */
  websocketUrl: process.env.WEBSOCKET_URL,

  /** BACKEND_URL — override proxy target URL in dev */
  viteBackendUrl: process.env.BACKEND_URL ?? process.env.VITE_BACKEND_URL,

  // #endregion

  // #region Testing & CI

  /** CI — truthy in CI environments */
  ci: process.env.CI,

  /** REPORT_TO_SLACK — post Playwright results to Slack */
  reportToSlack: process.env.REPORT_TO_SLACK,

  /** ANVIL_PORT — port for local Anvil blockchain fork */
  anvilPort: process.env.ANVIL_PORT,

  /** STORYBOOK_EXTENSION — enables extension mode in Storybook */
  storybookExtension: process.env.STORYBOOK_EXTENSION,

  // #endregion

  // #region Build Settings

  /** GIT_COMMIT_HASH — from `git rev-parse HEAD` */
  gitCommitHash: process.env.GIT_COMMIT_HASH ?? process.env.REACT_APP_GIT_COMMIT_HASH,

  /** ENABLE_REACT_COMPILER — opt-in to React Compiler babel plugin */
  enableReactCompiler: process.env.ENABLE_REACT_COMPILER,

  /** DISABLE_SOURCEMAP — skip sourcemap generation */
  disableSourcemap: process.env.DISABLE_SOURCEMAP ?? process.env.VITE_DISABLE_SOURCEMAP,

  /** DEBUG_PROXY — verbose entry-gateway proxy logging */
  debugProxy: process.env.DEBUG_PROXY ?? process.env.VITE_DEBUG_PROXY,

  /** SKIP_CSP — skip CSP meta tag injection */
  skipCsp: process.env.SKIP_CSP,

  /** CLOUDFLARE_ENV — wrangler environment name for CF deploys */
  cloudflareEnv: process.env.CLOUDFLARE_ENV,

  // #endregion

  // #region Analytics & Monitoring

  /** ANALYTICS_ENABLED — gates remote reporting */
  analyticsEnabled: process.env.ANALYTICS_ENABLED ?? process.env.REACT_APP_ANALYTICS_ENABLED,

  /** SENTRY_ENABLED — gates Sentry error reporting */
  sentryEnabled: process.env.SENTRY_ENABLED ?? process.env.REACT_APP_SENTRY_ENABLED,

  /** SENTRY_TRACES_SAMPLE_RATE — 0–1 float */
  sentryTracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE ?? process.env.REACT_APP_SENTRY_TRACES_SAMPLE_RATE,

  // #endregion
}

/** Zod schema for web-specific config fields */
const webConfigSchema = z.object({
  // Environment & Build Metadata
  webBuildType: z.string().default('vite').describe('Web build tool identifier'),
  gitCommitHash: z.string().default('').describe('Git commit hash at build time'),
  // API Keys
  walletConnectProjectId: z.string().min(1).describe('Project ID for WalletConnect'),

  // Endpoint URLs
  awsApiEndpoint: z.string().min(1).describe('URL for Apollo GraphQL API'),
  uniswapGatewayDns: z.string().min(1).describe('URL for Uniswap gateway v2'),
  entryGatewayApiUrl: z.string().optional().describe('URL for entry gateway BFF proxy'),
  websocketUrl: z.string().optional().describe('URL for WebSocket proxy'),
  viteBackendUrl: z.string().optional().describe('Override URL for Vite dev proxy target'),

  // Testing & CI
  ci: boolFromString.describe('Is the app running in CI'),
  reportToSlack: boolFromString.describe('Should Playwright results post to Slack'),
  anvilPort: z.coerce.number().default(8545).describe('Port for local Anvil blockchain fork'),
  storybookExtension: boolFromString.describe('Is Storybook extension mode enabled'),

  // Build Settings
  enableReactCompiler: boolFromString.describe('Is the React Compiler babel plugin enabled'),
  disableSourcemap: boolFromString.describe('Is sourcemap generation disabled'),
  debugProxy: boolFromString.describe('Is verbose entry-gateway proxy logging enabled'),
  skipCsp: boolFromString.describe('Is CSP meta tag injection skipped'),
  cloudflareEnv: z.string().optional().describe('Cloudflare wrangler environment name'),

  // Analytics & Monitoring
  analyticsEnabled: boolFromString.describe('Is remote analytics reporting enabled'),
  sentryEnabled: boolFromString.describe('Is Sentry error reporting enabled'),
  sentryTracesSampleRate: z.coerce.number().min(0).max(1).optional().describe('Sentry traces sample rate (0-1)'),
})

export type Config = Omit<BaseConfig, keyof z.infer<typeof webConfigSchema> & string> & z.infer<typeof webConfigSchema>

// Module-level cache for config to avoid recomputing on every call
let cachedConfig: Config | undefined

export const getConfig = (): Config => {
  if (cachedConfig !== undefined) {
    return cachedConfig
  }
  cachedConfig = parseConfig({
    values: webConfigValues,
    schema: webConfigSchema,
  })
  if (cachedConfig.environment !== Environment.Production && cachedConfig.nodeEnv !== NodeEnv.Test) {
    logger.debug('config.ts', 'getConfig', 'Using app config:', cachedConfig)
  }
  return cachedConfig
}

export function getPrivyConfig(isRequired = true): { appId: string; clientId: string } {
  const { privyAppId, privyClientId } = getConfig()
  // Web requires only appId to function
  if (isRequired && (!privyAppId || !privyClientId)) {
    throw new Error('Privy is not configured: PRIVY_APP_ID and PRIVY_CLIENT_ID must be set')
  }
  return { appId: privyAppId ?? '', clientId: privyClientId ?? '' }
}

export function getPrivyAppId(): string | undefined {
  return getPrivyConfig(false).appId || undefined
}

export function getUniswapServiceUrls(): UniswapServiceUrls {
  return getUniswapServiceUrlsFromOverrides(getConfig())
}

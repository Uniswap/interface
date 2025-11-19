/**
 * Naming requirements for different environments:
 * - Web ENV vars: must have process.env.REACT_APP_<var_name>
 * - Extension ENV vars: must have process.env.<var_name>
 * - Mobile ENV vars: must have BOTH process.env.<var_name> and <var_name>
 *
 *  The CI requires web vars to have the required 'REACT_APP_' prefix. The react-dot-env library doesnt integrate with CI correctly,
 *  so we pull from github secrets directly with process.env.<var_name> for both extension and mobile. <var_name> is used for local mobile builds.
 */

export interface Config {
  alchemyApiKey: string
  amplitudeProxyUrlOverride: string
  apiBaseUrlOverride: string
  apiBaseUrlV2Override: string
  appsflyerApiKey: string
  appsflyerAppId: string
  blockaidProxyUrl: string
  datadogClientToken: string
  datadogProjectId: string
  isE2ETest: boolean
  forApiUrlOverride: string
  graphqlUrlOverride: string
  includePrototypeFeatures: string
  infuraKey: string
  isVercelEnvironment: boolean
  jupiterProxyUrl: string
  onesignalAppId: string
  quicknodeEndpointName: string
  quicknodeEndpointToken: string
  scantasticApiUrlOverride: string
  statsigProxyUrlOverride: string
  statsigApiKey: string
  tradingApiKey: string
  tradingApiUrlOverride: string
  tradingApiWebTestEnv: string
  liquidityServiceUrlOverride: string
  uniswapApiKey: string
  unitagsApiUrlOverride: string
  uniswapNotifApiBaseUrlOverride: string
  entryGatewayApiUrlOverride: string
  walletConnectProjectId: string
  walletConnectProjectIdBeta: string
  walletConnectProjectIdDev: string
  enableSessionService: boolean
  enableSessionUpgradeAuto: boolean
  enableEntryGatewayProxy: boolean
}

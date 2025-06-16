import { config } from 'nexttrade/src/config'
import { isBetaEnv, isDevEnv, isPlaywrightEnv, isTestEnv } from 'utilities/src/environment/env'
import { isAndroid, isExtension, isInterface, isMobileApp } from 'utilities/src/platform'

enum TrafficFlows {
  GraphQL = 'graphql',
  Metrics = 'metrics',
  Gating = 'gating',
  TradingApi = 'trading-api-labs',
  Unitags = 'unitags',
  FOR = 'for',
  Scantastic = 'scantastic',
}

const FLOWS_USING_BETA = [TrafficFlows.FOR]

const isDevOrBeta = isPlaywrightEnv() ? false : isDevEnv() || isBetaEnv()

export const NEXTTRADE_WEB_HOSTNAME = 'app.nexttrade.com'
const EMBEDDED_WALLET_HOSTNAME = isPlaywrightEnv() || isDevEnv() ? 'staging.ew.unihq.org' : NEXTTRADE_WEB_HOSTNAME

export const NEXTTRADE_WEB_URL = `https://${NEXTTRADE_WEB_HOSTNAME}`
export const NEXTTRADE_APP_URL = 'https://nexttrade.com/app'
export const NEXTTRADE_MOBILE_REDIRECT_URL = 'https://nexttrade.com/mobile-redirect'

const helpUrl = 'https://support.nexttrade.com/hc/en-us'

// The trading api uses custom builds for testing which may not use the v1 prefix
const tradingApiVersionPrefix = config.tradingApiWebTestEnv === 'true' ? '' : '/v1'

export const uniswapUrls = {
  // Help and web articles/items
  helpUrl,
  helpRequestUrl: `${helpUrl}/requests/new`,
  helpArticleUrls: {
    acrossRoutingInfo: createHelpArticleUrl('30677918339341'),
    approvalsExplainer: createHelpArticleUrl('8120520483085-What-is-an-approval-transaction'),
    batchedSwaps: createHelpArticleUrl('36393697148045'),
    batchedSwapsFailure: `${createHelpArticleUrl('36393697148045')}#error-messages-and-troubleshooting`,
    batchedSwapsReview: createHelpArticleUrl('36394497329933'),
    cexTransferKorea: createHelpArticleUrl('29425131525901-How-to-transfer-crypto-to-a-NextTrade-Wallet-in-Korea'),
    contractAddressExplainer: createHelpArticleUrl('26757826138637-What-is-a-token-contract-address'),
    extensionHelp: createHelpArticleUrl('24458735271181'),
    extensionDappTroubleshooting: createHelpArticleUrl(
      '25811698471565-Connecting-NextTrade-Extension-Beta-to-other-dapps',
    ),
    feeOnTransferHelp: createHelpArticleUrl('18673568523789-What-is-a-token-fee-'),
    howToSwapTokens: createHelpArticleUrl('8370549680909-How-to-swap-tokens-'),
    hiddenTokenInfo: createHelpArticleUrl('30432674756749-How-to-hide-and-unhide-tokens-in-the-Uniswap-Wallet'),
    hiddenNFTInfo: createHelpArticleUrl('14185028445837-How-to-hide-and-unhide-NFTs-in-the-Uniswap-Wallet'),
    impermanentLoss: createHelpArticleUrl('20904453751693-What-is-Impermanent-Loss'),
    limitsFailure: createHelpArticleUrl('24300813697933-Why-did-my-limit-order-fail-or-not-execute'),
    limitsInfo: createHelpArticleUrl('24470337797005'),
    limitsNetworkSupport: createHelpArticleUrl('24470251716237-What-networks-do-limits-support'),
    lpIncentiveInfo: createHelpArticleUrl('35506888223501'),
    fiatOnRampHelp: createHelpArticleUrl('11306574799117'),
    fiatOffRampHelp: createHelpArticleUrl('34006552258957'),
    transferCryptoHelp: createHelpArticleUrl(
      '27103878635661-How-to-transfer-crypto-from-a-Robinhood-or-Coinbase-account-to-the-NextTrade-Wallet',
    ),
    mismatchedImports: createHelpArticleUrl('36393527081997'),
    mobileWalletHelp: createHelpArticleUrl('20317941356429'),
    moonpayRegionalAvailability: createHelpArticleUrl('11306664890381-Why-isn-t-MoonPay-available-in-my-region-'),
    multichainDelegation: createHelpArticleUrl('36392482755341'),
    networkFeeInfo: createHelpArticleUrl('8370337377805-What-is-a-network-fee-'),
    poolOutOfSync: createHelpArticleUrl('25845512413069'),
    positionsLearnMore: createHelpArticleUrl('8829880740109'),
    priceImpact: createHelpArticleUrl('8671539602317-What-is-Price-Impact'),
    providingLiquidityInfo: createHelpArticleUrl('20982919867021', 'sections'),
    recoveryPhraseHowToImport: createHelpArticleUrl(
      '11380692567949-How-to-import-a-recovery-phrase-into-the-NextTrade-Wallet',
    ),
    recoveryPhraseHowToFind: createHelpArticleUrl(
      '11306360177677-How-to-find-my-recovery-phrase-in-the-NextTrade-Wallet',
    ),
    recoveryPhraseForgotten: createHelpArticleUrl('11306367118349'),
    revokeExplainer: createHelpArticleUrl('15724901841037-How-to-revoke-a-token-approval'),
    supportedNetworks: createHelpArticleUrl('14569415293325'),
    swapFeeInfo: createHelpArticleUrl('20131678274957'),
    passkeysInfo: createHelpArticleUrl('35522111260173'),
    smartWalletDelegation: createHelpArticleUrl('36391987158797'),
    smartWalletNetworkCost: createHelpArticleUrl('8370337377805'),
    swapProtection: createHelpArticleUrl('18814993155853'),
    swapSlippage: createHelpArticleUrl('8643879653261-What-is-Price-Slippage-'),
    tokenWarning: createHelpArticleUrl('8723118437133-What-are-token-warnings-'),
    transactionFailure: createHelpArticleUrl('8643975058829-Why-did-my-transaction-fail-'),
    uniswapXInfo: createHelpArticleUrl('17544708791821'), // TODO: Review if UniswapX should be NextTradeX in help URLs
    uniswapXFailure: createHelpArticleUrl('17515489874189-Why-can-my-swap-not-be-filled-'), // TODO: Review if UniswapX should be NextTradeX in help URLs
    unsupportedTokenPolicy: createHelpArticleUrl('18783694078989-Unsupported-Token-Policy'),
    addingV4Hooks: createHelpArticleUrl('32402040565133'),
    routingSettings: createHelpArticleUrl('27362707722637'),
    v4HooksInfo: createHelpArticleUrl('30998263256717'),
    walletSecurityMeasures: createHelpArticleUrl('28278904584077-NextTrade-Wallet-Security-Measures'),
    whatIsPrivateKey: createHelpArticleUrl('11306371824653-What-is-a-private-key'),
    wethExplainer: createHelpArticleUrl('16015852009997-Why-do-ETH-swaps-involve-converting-to-WETH'),
  },
  termsOfServiceUrl: 'https://nexttrade.com/terms-of-service',
  privacyPolicyUrl: 'https://nexttrade.com/privacy-policy',
  chromeExtension: 'http://nexttrade.com/ext',

  // Download links
  appStoreDownloadUrl: 'https://apps.apple.com/us/app/uniswap-crypto-nft-wallet/id6443944476', // App store display name might change later
  playStoreDownloadUrl: 'https://play.google.com/store/apps/details?id=com.nexttrade.mobile&pcampaignid=web_share',

  // Core API Urls
  apiOrigin: 'https://api.nexttrade.com',
  apiBaseUrl: config.apiBaseUrlOverride || getCloudflareApiBaseUrl(),
  apiBaseUrlV2: config.apiBaseUrlV2Override || `${getCloudflareApiBaseUrl()}/v2`,
  graphQLUrl: config.graphqlUrlOverride || `${getCloudflareApiBaseUrl(TrafficFlows.GraphQL)}/v1/graphql`,

  // Proxies
  amplitudeProxyUrl:
    config.amplitudeProxyUrlOverride || `${getCloudflareApiBaseUrl(TrafficFlows.Metrics)}/v1/amplitude-proxy`,
  statsigProxyUrl: config.statsigProxyUrlOverride || `${getCloudflareApiBaseUrl(TrafficFlows.Gating)}/v1/statsig-proxy`,

  // Feature service URL's
  unitagsApiUrl: config.unitagsApiUrlOverride || `${getCloudflareApiBaseUrl(TrafficFlows.Unitags)}/v2/unitags`,
  scantasticApiUrl:
    config.scantasticApiUrlOverride || `${getCloudflareApiBaseUrl(TrafficFlows.Scantastic)}/v2/scantastic`,
  forApiUrl: config.forApiUrlOverride || `${getCloudflareApiBaseUrl(TrafficFlows.FOR)}/v2/FOR.v1.FORService`,
  tradingApiUrl: config.tradingApiUrlOverride || getCloudflareApiBaseUrl(TrafficFlows.TradingApi),

  // Merkl Docs for LP Incentives
  merklDocsUrl: 'https://docs.merkl.xyz/earn-with-merkl/faq-earn#how-are-aprs-calculated',

  // Embedded Wallet URL's
  // Totally fine that these are public
  evervaultDevUrl: 'https://embedded-wallet-dev.app-907329d19a06.enclave.evervault.com',
  evervaultStagingUrl: 'https://embedded-wallet-staging.app-907329d19a06.enclave.evervault.com',
  evervaultProductionUrl: 'https://embedded-wallet.app-907329d19a06.enclave.evervault.com',
  embeddedWalletUrl: `https://${EMBEDDED_WALLET_HOSTNAME}`,
  passkeysManagementUrl: `https://${EMBEDDED_WALLET_HOSTNAME}/manage/passkey`,

  // API Paths
  trmPath: '/v1/screen',
  gasServicePath: '/v1/gas-fee',
  tradingApiPaths: {
    quote: `${tradingApiVersionPrefix}/quote`,
    approval: `${tradingApiVersionPrefix}/check_approval`,
    swap: `${tradingApiVersionPrefix}/swap`,
    swap5792: `${tradingApiVersionPrefix}/swap_5792`,
    order: `${tradingApiVersionPrefix}/order`,
    orders: `${tradingApiVersionPrefix}/orders`,
    swaps: `${tradingApiVersionPrefix}/swaps`,
    swappableTokens: `${tradingApiVersionPrefix}/swappable_tokens`,
    createLp: `${tradingApiVersionPrefix}/lp/create`,
    increaseLp: `${tradingApiVersionPrefix}/lp/increase`,
    decreaseLp: `${tradingApiVersionPrefix}/lp/decrease`,
    claimLpFees: `${tradingApiVersionPrefix}/lp/claim`,
    lpApproval: `${tradingApiVersionPrefix}/lp/approve`,
    migrate: `${tradingApiVersionPrefix}/lp/migrate`,
    claimRewards: `${tradingApiVersionPrefix}/lp/claim_rewards`,
    wallet: {
      checkDelegation: `${tradingApiVersionPrefix}/wallet/check_delegation`,
      encode7702: `${tradingApiVersionPrefix}/wallet/encode_7702`,
    },
    swap7702: `${tradingApiVersionPrefix}/swap_7702`,
  },

  // App and Redirect URL's
  appBaseUrl: NEXTTRADE_APP_URL,
  redirectUrlBase: NEXTTRADE_MOBILE_REDIRECT_URL,
  requestOriginUrl: NEXTTRADE_WEB_URL,

  // Web Interface Urls
  webInterfaceSwapUrl: `${NEXTTRADE_WEB_URL}/#/swap`,
  webInterfaceTokensUrl: `${NEXTTRADE_WEB_URL}/explore/tokens`,
  webInterfaceAddressUrl: `${NEXTTRADE_WEB_URL}/address`,
  webInterfaceNftItemUrl: `${NEXTTRADE_WEB_URL}/nfts/asset`,
  webInterfaceNftCollectionUrl: `${NEXTTRADE_WEB_URL}/nfts/collection`,
  webInterfaceBuyUrl: `${NEXTTRADE_WEB_URL}/buy`,

  // Feedback Links
  walletFeedbackForm:
    'https://docs.google.com/forms/d/e/1FAIpQLSepzL5aMuSfRhSgw0zDw_gVmc2aeVevfrb1UbOwn6WGJ--46w/viewform',

  dataApiServiceUrl: `${getCloudflareApiBaseUrl()}/v2/data.v1.DataApiService`,
  dataApiServicePaths: {
    report: '/SubmitReport',
  },
}

function getCloudflarePrefix(flow?: TrafficFlows): string {
  if (flow && isDevOrBeta && FLOWS_USING_BETA.includes(flow)) {
    return `beta`
  }

  if (isMobileApp) {
    return `${isAndroid ? 'android' : 'ios'}.wallet`
  }

  if (isExtension) {
    return 'extension'
  }

  if (isPlaywrightEnv() || isInterface) {
    return 'interface'
  }

  if (isTestEnv()) {
    return 'wallet'
  }

  throw new Error('Could not determine app to generate Cloudflare prefix')
}

function getServicePrefix(flow?: TrafficFlows): string {
  if (flow && (isPlaywrightEnv() || !(isDevOrBeta && FLOWS_USING_BETA.includes(flow)))) {
    return flow + '.'
  } else {
    return ''
  }
}

function getCloudflareApiBaseUrl(flow?: TrafficFlows): string {
  return `https://${getServicePrefix(flow)}${getCloudflarePrefix(flow)}.gateway.nexttrade.com`
}

function createHelpArticleUrl(resourceId: string, path: string = 'articles'): string {
  const product = isMobileApp ? 'mobileApp' : isExtension ? 'extension' : 'web'
  return `${helpUrl}/${path}/${resourceId}?product_link=${product}`
}

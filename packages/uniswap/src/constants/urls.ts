import { createHelpArticleUrl, getCloudflareApiBaseUrl, helpUrl, TrafficFlows } from '@universe/api'
import { config } from 'uniswap/src/config'
import { isDevEnv, isPlaywrightEnv } from 'utilities/src/environment/env'

export const UNISWAP_WEB_HOSTNAME = 'app.uniswap.org'
const EMBEDDED_WALLET_HOSTNAME = isPlaywrightEnv() || isDevEnv() ? 'staging.ew.unihq.org' : UNISWAP_WEB_HOSTNAME

export const UNISWAP_WEB_URL = `https://${UNISWAP_WEB_HOSTNAME}`
export const UNISWAP_APP_URL = 'https://uniswap.org/app'
export const UNISWAP_MOBILE_REDIRECT_URL = 'https://uniswap.org/mobile-redirect'

// The trading api uses custom builds for testing which may not use the v1 prefix
export const tradingApiVersionPrefix = config.tradingApiWebTestEnv === 'true' ? '' : '/v1'

export const CHROME_EXTENSION_UNINSTALL_URL_PATH = '/extension/uninstall'

export const uniswapUrls = {
  // Help and web articles/items
  helpUrl,
  helpRequestUrl: `${helpUrl}/requests/new`,
  helpArticleUrls: {
    bridgedAssets: createHelpArticleUrl('39264728322317'),
    acrossRoutingInfo: createHelpArticleUrl('30677918339341'),
    approvalsExplainer: createHelpArticleUrl('8120520483085-What-is-an-approval-transaction'),
    batchedSwaps: createHelpArticleUrl('36393697148045'),
    batchedSwapsFailure: `${createHelpArticleUrl('36393697148045')}#error-messages-and-troubleshooting`,
    batchedSwapsReview: createHelpArticleUrl('36394497329933'),
    cexTransferKorea: createHelpArticleUrl('29425131525901-How-to-transfer-crypto-to-a-Uniswap-Wallet-in-Korea'),
    contractAddressExplainer: createHelpArticleUrl('26757826138637-What-is-a-token-contract-address'),
    extensionBiometricsEnrollment: createHelpArticleUrl('38225957094541'),
    extensionHelp: createHelpArticleUrl('24458735271181'),
    extensionDappTroubleshooting: createHelpArticleUrl(
      '25811698471565-Connecting-Uniswap-Extension-Beta-to-other-dapps',
    ),
    feeOnTransferHelp: createHelpArticleUrl('18673568523789-What-is-a-token-fee-'),
    howToSwapTokens: createHelpArticleUrl('8370549680909-How-to-swap-tokens-'),
    hiddenTokenInfo: createHelpArticleUrl('30432674756749-How-to-hide-and-unhide-tokens-in-the-Uniswap-Wallet'),
    hiddenNFTInfo: createHelpArticleUrl('14185028445837-How-to-hide-and-unhide-NFTs-in-the-Uniswap-Wallet'),
    impermanentLoss: createHelpArticleUrl('20904453751693-What-is-Impermanent-Loss'),
    jupiterApiError: createHelpArticleUrl('39829559404685'),
    limitsFailure: createHelpArticleUrl('24300813697933-Why-did-my-limit-order-fail-or-not-execute'),
    limitsInfo: createHelpArticleUrl('24470337797005'),
    limitsNetworkSupport: createHelpArticleUrl('24470251716237-What-networks-do-limits-support'),
    lpIncentiveInfo: createHelpArticleUrl('35506888223501'),
    fiatOnRampHelp: createHelpArticleUrl('11306574799117'),
    fiatOffRampHelp: createHelpArticleUrl('34006552258957'),
    transferCryptoHelp: createHelpArticleUrl(
      '27103878635661-How-to-transfer-crypto-from-a-Robinhood-or-Coinbase-account-to-the-Uniswap-Wallet',
    ),
    mismatchedImports: createHelpArticleUrl('36393527081997'),
    mobileWalletHelp: createHelpArticleUrl('20317941356429'),
    moonpayRegionalAvailability: createHelpArticleUrl('11306664890381-Why-isn-t-MoonPay-available-in-my-region-'),
    multichainDelegation: createHelpArticleUrl('36391987158797'),
    networkFeeInfo: createHelpArticleUrl('8370337377805-What-is-a-network-fee-'),
    poolOutOfSync: createHelpArticleUrl('25845512413069'),
    positionsLearnMore: createHelpArticleUrl('8829880740109'),
    priceImpact: createHelpArticleUrl('8671539602317-What-is-Price-Impact'),
    providingLiquidityInfo: createHelpArticleUrl('20982919867021', 'sections'),
    recoveryPhraseHowToImport: createHelpArticleUrl(
      '11380692567949-How-to-import-a-recovery-phrase-into-the-Uniswap-Wallet',
    ),
    recoveryPhraseHowToFind: createHelpArticleUrl(
      '11306360177677-How-to-find-my-recovery-phrase-in-the-Uniswap-Wallet',
    ),
    recoveryPhraseForgotten: createHelpArticleUrl('11306367118349'),
    revokeExplainer: createHelpArticleUrl('15724901841037-How-to-revoke-a-token-approval'),
    supportedNetworks: createHelpArticleUrl('14569415293325'),
    swapFeeInfo: createHelpArticleUrl('20131678274957'),
    passkeysInfo: createHelpArticleUrl('35522111260173'),
    smartWalletDelegation: createHelpArticleUrl('36391987158797'),
    swapProtection: createHelpArticleUrl('18814993155853'),
    swapSlippage: createHelpArticleUrl('8643879653261-What-is-Price-Slippage-'),
    tokenWarning: createHelpArticleUrl('8723118437133-What-are-token-warnings-'),
    transactionFailure: createHelpArticleUrl('8643975058829-Why-did-my-transaction-fail-'),
    uniswapXInfo: createHelpArticleUrl('17544708791821'),
    uniswapXFailure: createHelpArticleUrl('17515489874189-Why-can-my-swap-not-be-filled-'),
    unsupportedTokenPolicy: createHelpArticleUrl('18783694078989-Unsupported-Token-Policy'),
    addingV4Hooks: createHelpArticleUrl('32402040565133'),
    routingSettings: createHelpArticleUrl('27362707722637'),
    v4HooksInfo: createHelpArticleUrl('30998263256717'),
    walletSecurityMeasures: createHelpArticleUrl('28278904584077-Uniswap-Wallet-Security-Measures'),
    whatIsPrivateKey: createHelpArticleUrl('11306371824653-What-is-a-private-key'),
    wethExplainer: createHelpArticleUrl('16015852009997-Why-do-ETH-swaps-involve-converting-to-WETH'),
  },
  downloadWalletUrl: 'https://wallet.uniswap.org/',
  tradingApiDocsUrl: 'https://hub.uniswap.org/',
  unichainUrl: 'https://www.unichain.org/',
  uniswapXUrl: 'https://x.uniswap.org/',
  helpCenterUrl: 'https://help.uniswap.org/',
  blogUrl: 'https://blog.uniswap.org/',
  docsUrl: 'https://docs.uniswap.org/',
  voteUrl: 'https://vote.uniswapfoundation.org',
  governanceUrl: 'https://uniswap.org/governance',
  developersUrl: 'https://uniswap.org/developers',
  aboutUrl: 'https://about.uniswap.org/',
  careersUrl: 'https://careers.uniswap.org/',
  social: {
    x: 'https://x.com/Uniswap',
    farcaster: 'https://farcaster.xyz/Uniswap',
    linkedin: 'https://www.linkedin.com/company/uniswaporg',
    tiktok: 'https://www.tiktok.com/@uniswap',
  },
  termsOfServiceUrl: 'https://uniswap.org/terms-of-service',
  privacyPolicyUrl: 'https://uniswap.org/privacy-policy',
  chromeExtension: 'http://uniswap.org/ext',
  chromeExtensionUninstallUrl: `${UNISWAP_WEB_URL}${CHROME_EXTENSION_UNINSTALL_URL_PATH}`,

  // Download links
  appStoreDownloadUrl: 'https://apps.apple.com/us/app/uniswap-crypto-nft-wallet/id6443944476',
  playStoreDownloadUrl: 'https://play.google.com/store/apps/details?id=com.uniswap.mobile&pcampaignid=web_share',

  // Core API Urls
  apiOrigin: 'https://api.uniswap.org',
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
    approval: `${tradingApiVersionPrefix}/check_approval`,
    claimLpFees: `${tradingApiVersionPrefix}/lp/claim`,
    claimRewards: `${tradingApiVersionPrefix}/lp/claim_rewards`,
    createLp: `${tradingApiVersionPrefix}/lp/create`,
    decreaseLp: `${tradingApiVersionPrefix}/lp/decrease`,
    increaseLp: `${tradingApiVersionPrefix}/lp/increase`,
    lpApproval: `${tradingApiVersionPrefix}/lp/approve`,
    migrate: `${tradingApiVersionPrefix}/lp/migrate`,
    poolInfo: `${tradingApiVersionPrefix}/lp/pool_info`,
    order: `${tradingApiVersionPrefix}/order`,
    orders: `${tradingApiVersionPrefix}/orders`,
    plan: `${tradingApiVersionPrefix}/plan`,
    priceDiscrepancy: `${tradingApiVersionPrefix}/lp/price_discrepancy`,
    quote: `${tradingApiVersionPrefix}/quote`,
    swap: `${tradingApiVersionPrefix}/swap`,
    swap5792: `${tradingApiVersionPrefix}/swap_5792`,
    swap7702: `${tradingApiVersionPrefix}/swap_7702`,
    swappableTokens: `${tradingApiVersionPrefix}/swappable_tokens`,
    swaps: `${tradingApiVersionPrefix}/swaps`,
    wallet: {
      checkDelegation: `${tradingApiVersionPrefix}/wallet/check_delegation`,
      encode7702: `${tradingApiVersionPrefix}/wallet/encode_7702`,
    },
  },

  wormholeUrl: 'https://portalbridge.com/',

  // Limit orders paths
  limitOrderStatusesPath: '/limit-orders',

  // App and Redirect URL's
  appBaseUrl: UNISWAP_APP_URL,
  redirectUrlBase: UNISWAP_MOBILE_REDIRECT_URL,
  requestOriginUrl: UNISWAP_WEB_URL,

  // Web Interface Urls
  webInterfaceSwapUrl: `${UNISWAP_WEB_URL}/#/swap`,
  webInterfaceTokensUrl: `${UNISWAP_WEB_URL}/explore/tokens`,
  webInterfacePoolsUrl: `${UNISWAP_WEB_URL}/explore/pools`,
  webInterfaceAddressUrl: `${UNISWAP_WEB_URL}/address`,
  webInterfaceNftItemUrl: `${UNISWAP_WEB_URL}/nfts/asset`,
  webInterfaceNftCollectionUrl: `${UNISWAP_WEB_URL}/nfts/collection`,
  webInterfaceBuyUrl: `${UNISWAP_WEB_URL}/buy`,

  // Feedback Links
  walletFeedbackForm:
    'https://docs.google.com/forms/d/e/1FAIpQLSepzL5aMuSfRhSgw0zDw_gVmc2aeVevfrb1UbOwn6WGJ--46w/viewform',

  dataApiServiceUrl: `${getCloudflareApiBaseUrl()}/v2/data.v1.DataApiService`,
}

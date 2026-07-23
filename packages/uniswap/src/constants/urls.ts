import {
  createHelpArticleUrl,
  DEV_ENTRY_GATEWAY_API_BASE_URL,
  getCloudflareApiBaseUrl,
  getEntryGatewayUrl,
  getForApiUrl,
  helpUrl,
  PROD_ENTRY_GATEWAY_API_BASE_URL,
  STAGING_ENTRY_GATEWAY_API_BASE_URL,
  TrafficFlows,
} from '@universe/api'
import { isWebApp, isBetaEnv, isDevEnv, isE2eTestEnv } from '@universe/environment'

export const UNISWAP_WEB_HOSTNAME = 'app.uniswap.org'
export const UNISWAP_WEB_URL = `https://${UNISWAP_WEB_HOSTNAME}`
export const CHROME_EXTENSION_UNINSTALL_URL_PATH = '/extension/uninstall'
// Liquidity service uses dedicated backend-{env} hosts. Dev and staging builds both use the staging
// backend (consistent with the entry gateway + websocket URLs, which collapse dev → staging to avoid
// localhost CORS); prod uses the prod backend. An explicit override always wins.
const STAGING_LIQUIDITY_SERVICE_URL = 'https://liquidity.backend-staging.api.uniswap.org'
const PROD_LIQUIDITY_SERVICE_URL = 'https://liquidity.backend-prod.api.uniswap.org'

export const UniswapHelpUrls = {
  // Help and web articles/items
  baseUrl: helpUrl,
  requestUrl: `${helpUrl}/requests/new`,
  articles: {
    bridgedAssets: createHelpArticleUrl('39264728322317'),
    acrossRoutingInfo: createHelpArticleUrl('30677918339341'),
    approvalsExplainer: createHelpArticleUrl('8120520483085-What-is-an-approval-transaction'),
    batchedSwaps: createHelpArticleUrl('36393697148045'),
    batchedSwapsFailure: `${createHelpArticleUrl('36393697148045')}#error-messages-and-troubleshooting`,
    batchedSwapsReview: createHelpArticleUrl('36394497329933'),
    cexTransferKorea: createHelpArticleUrl('29425131525901-How-to-transfer-crypto-to-a-Uniswap-Wallet-in-Korea'),
    contractAddressExplainer: createHelpArticleUrl('26757826138637-What-is-a-token-contract-address'),
    dappProtectionInfo: createHelpArticleUrl('37781087046029'),
    earnHelp: createHelpArticleUrl('46865818181901'),
    extensionBiometricsEnrollment: createHelpArticleUrl('38225957094541'),
    extensionHelp: createHelpArticleUrl('24458735271181'),
    extensionDappTroubleshooting: createHelpArticleUrl(
      '25811698471565-Connecting-Uniswap-Extension-Beta-to-other-dapps',
    ),
    feeOnTransferHelp: createHelpArticleUrl('18673568523789-What-is-a-token-fee-'),
    gasSponsorship: createHelpArticleUrl('47061440677133'),
    geoRestriction: createHelpArticleUrl('46373846019981'),
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
    providingLiquidityInfo: createHelpArticleUrl('20982919867021', { path: 'sections' }),
    providingLiquidityVersions: createHelpArticleUrl('30998269400333'),
    recoveryPhraseHowToImport: createHelpArticleUrl(
      '11380692567949-How-to-import-a-recovery-phrase-into-the-Uniswap-Wallet',
    ),
    recoveryPhraseHowToFind: createHelpArticleUrl(
      '11306360177677-How-to-find-my-recovery-phrase-in-the-Uniswap-Wallet',
    ),
    recoveryPhraseForgotten: createHelpArticleUrl('11306367118349'),
    revokeExplainer: createHelpArticleUrl('15724901841037-How-to-revoke-a-token-approval'),
    rwaExploreDisclaimer: createHelpArticleUrl('46577159640589'),
    rwaExploreDisclaimerEtfs: createHelpArticleUrl('46601854111501'),
    rwaOffHours: createHelpArticleUrl('46572002944013'),
    supportedNetworks: createHelpArticleUrl('14569415293325'),
    swapFeeInfo: createHelpArticleUrl('20131678274957'),
    passkeysInfo: createHelpArticleUrl('35522111260173'),
    // TODO(INFRA): swap placeholder id for the rotation help article
    backupLoginReconnect: createHelpArticleUrl('35522111260173'),
    smartWalletDelegation: createHelpArticleUrl('36391987158797'),
    swapProtection: createHelpArticleUrl('18814993155853'),
    swapSlippage: createHelpArticleUrl('8643879653261-What-is-Price-Slippage-'),
    swapDeadline: createHelpArticleUrl('45320061462797'),
    toucanBidHelp: createHelpArticleUrl(
      '43106804833421-How-to-participate-in-token-auctions-on-Uniswap#bidding-in-an-auction',
    ),
    toucanBidDetailsHelp: createHelpArticleUrl(
      '43106804833421-How-to-participate-in-token-auctions-on-Uniswap#bidding-in-an-auction',
    ),
    toucanIntro: createHelpArticleUrl('43107626487437'),
    toucanFailedToLaunchHelp: createHelpArticleUrl(
      '43107626487437-What-are-Continuous-Clearing-Auctions#what-is-a-graduation-threshold',
    ),
    toucanLaunchAuctionHelp: createHelpArticleUrl('46569604134157'),
    // Deep-links into specific sections of the published CCA launch guide; anchors match the article's headings.
    toucanLaunchAuctionConfigureAuctionHelp: createHelpArticleUrl(
      '46569604134157-Launching-a-Continuous-Clearing-Auction',
      { section: 'set-your-auction-details' },
    ),
    toucanLaunchAuctionCustomizePoolHelp: createHelpArticleUrl(
      '46569604134157-Launching-a-Continuous-Clearing-Auction',
      { section: 'configure-the-liquidity-pool-your-auction-will-seed-into-at-the-end' },
    ),
    toucanVerifiedAuctionsHelp: createHelpArticleUrl('43107250032781'),
    tokenWarning: createHelpArticleUrl('8723118437133-What-are-token-warnings-'),
    toucanWithdrawHelp: createHelpArticleUrl(
      '43106804833421-How-to-participate-in-token-auctions-on-Uniswap#claiming-your-tokens-and-unspent-budget',
    ),
    transactionFailure: createHelpArticleUrl('8643975058829-Why-did-my-transaction-fail-'),
    uniswapXInfo: createHelpArticleUrl('17544708791821'),
    uniswapXFailure: createHelpArticleUrl('17515489874189-Why-can-my-swap-not-be-filled-'),
    uniswapLabsTermsOfService: createHelpArticleUrl('30935100859661-Uniswap-Labs-Terms-of-Service'),
    unsupportedTokenPolicy: createHelpArticleUrl('18783694078989-Unsupported-Token-Policy'),
    addingV4Hooks: createHelpArticleUrl('32402040565133'),
    routingSettings: createHelpArticleUrl('27362707722637'),
    uniswapVersionsInfo: createHelpArticleUrl('7425482965517-Uniswap-v2-v3-and-v4'),
    v4HooksInfo: createHelpArticleUrl('30998263256717'),
    subgraphDowntime: createHelpArticleUrl('23952001935373-Subgraph-downtime'),
    walletSecurityMeasures: createHelpArticleUrl('28278904584077-Uniswap-Wallet-Security-Measures'),
    whatIsPrivateKey: createHelpArticleUrl('11306371824653-What-is-a-private-key'),
    wethExplainer: createHelpArticleUrl('16015852009997-Why-do-ETH-swaps-involve-converting-to-WETH'),
  },
}

export const UniswapStaticUrls = {
  downloadWalletUrl: 'https://wallet.uniswap.org/',
  tradingApiDocsUrl: 'https://hub.uniswap.org/',
  morphoDisclaimerUrl: 'https://morpho.org/disclaimers/',
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
  bugBountyUrl: 'https://cantina.xyz/bounties/f9df94db-c7b1-434b-bb06-d1360abdd1be',
  termsOfServiceUrl: 'https://uniswap.org/terms-of-service',
  privacyPolicyUrl: 'https://uniswap.org/privacy-policy',
  chromeExtension: 'http://uniswap.org/ext',
  chromeExtensionUninstallUrl: `${UNISWAP_WEB_URL}${CHROME_EXTENSION_UNINSTALL_URL_PATH}`,

  // Download links
  appStoreDownloadUrl: 'https://apps.apple.com/us/app/uniswap-crypto-nft-wallet/id6443944476',
  playStoreDownloadUrl: 'https://play.google.com/store/apps/details?id=com.uniswap.mobile&pcampaignid=web_share',

  // Core API Urls
  apiOrigin: 'https://api.uniswap.org',

  // Merkl Docs for LP Incentives
  merklDocsUrl: 'https://docs.merkl.xyz/earn-with-merkl/faq-earn#how-are-aprs-calculated',

  uniswapAssetsBlockchainsBaseUrl: 'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains',

  // Embedded Wallet URL's
  // Totally fine that these are public
  evervaultDevUrl: 'https://embedded-wallet-dev.app-907329d19a06.enclave.evervault.com',
  evervaultStagingUrl: 'https://embedded-wallet-staging.app-907329d19a06.enclave.evervault.com',
  evervaultProductionUrl: 'https://embedded-wallet.app-907329d19a06.enclave.evervault.com',

  wormholeUrl: 'https://portalbridge.com/',

  // App and Redirect URL's
  appBaseUrl: 'https://uniswap.org/app',
  redirectUrlBase: 'https://uniswap.org/mobile-redirect',
  requestOriginUrl: UNISWAP_WEB_URL,

  // Web Interface Urls
  webInterfaceSwapUrl: `${UNISWAP_WEB_URL}/#/swap`,
  webInterfaceTokensUrl: `${UNISWAP_WEB_URL}/explore/tokens`,
  webInterfacePoolsUrl: `${UNISWAP_WEB_URL}/explore/pools`,
  webInterfacePortfolioUrl: `${UNISWAP_WEB_URL}/portfolio`,
  webInterfaceBuyUrl: `${UNISWAP_WEB_URL}/buy`,

  // Feedback Links
  walletFeedbackForm:
    'https://docs.google.com/forms/d/e/1FAIpQLSepzL5aMuSfRhSgw0zDw_gVmc2aeVevfrb1UbOwn6WGJ--46w/viewform',
}

/**
 * Config-derived URL overrides
 */
export interface UniswapUrlOverrides {
  amplitudeProxyUrlOverride?: string
  apiBaseUrlOverride?: string
  apiBaseUrlV2Override?: string
  forApiUrlOverride?: string
  graphqlUrlOverride?: string
  liquidityServiceUrlOverride?: string
  scantasticApiUrlOverride?: string
  statsigProxyUrlOverride?: string
  tradingApiUrlOverride?: string
  tradingApiWebTestEnv?: string
  // When a Beta build sets this to true, beta points its APIs at prod instead of staging.
  // Unset/false (the default) preserves beta → staging. Only set on mobile beta builds.
  isBetaUsingProdApi?: boolean
}

export interface UniswapServiceUrls {
  amplitudeProxyUrl: string
  apiBaseUrl: string
  apiBaseUrlV2: string
  complianceApiBaseUrl: string
  dataApiBaseUrlV2: string
  dataApiServiceUrl: string
  embeddedWalletHostname: string
  embeddedWalletUrl: string
  forApiUrl: string
  graphQLUrl: string
  liquidityServiceUrl: string
  passkeysManagementUrl: string
  privyEmbeddedWalletUrl: string
  privyEncryptedAuthorizationKeysUrl: string
  scantasticApiUrl: string
  statsigProxyUrl: string
  tradingApiUrl: string
}

export function getUniswapServiceUrls(overrides: UniswapUrlOverrides): UniswapServiceUrls {
  // A beta build routes to staging by default, but can be built to point at prod
  // (selected at workflow-trigger time). Beta → prod is opt-in: only when isBetaUsingProdApi is true.
  const isBetaStaging = isBetaEnv() && !overrides.isBetaUsingProdApi

  const embeddedWalletHostname =
    isE2eTestEnv() || isDevEnv() ? 'dev.ew.unihq.org' : isBetaStaging ? 'app.corn-staging.com' : UNISWAP_WEB_HOSTNAME

  return {
    amplitudeProxyUrl:
      overrides.amplitudeProxyUrlOverride ||
      getCloudflareApiBaseUrl({ flow: TrafficFlows.Metrics, postfix: 'v1/amplitude-proxy' }),

    apiBaseUrl: overrides.apiBaseUrlOverride || getCloudflareApiBaseUrl(),

    apiBaseUrlV2: overrides.apiBaseUrlV2Override || getCloudflareApiBaseUrl({ postfix: 'v2' }),

    // Dev and staging both use the staging compliance backend; e2e and prod use prod.
    complianceApiBaseUrl:
      !isE2eTestEnv() && (isDevEnv() || isBetaStaging)
        ? STAGING_ENTRY_GATEWAY_API_BASE_URL
        : PROD_ENTRY_GATEWAY_API_BASE_URL,

    dataApiBaseUrlV2:
      overrides.apiBaseUrlV2Override || getCloudflareApiBaseUrl({ flow: TrafficFlows.DataApi, postfix: 'v2' }),

    dataApiServiceUrl: getCloudflareApiBaseUrl({ postfix: 'v2/data.v1.DataApiService' }),

    embeddedWalletHostname,

    embeddedWalletUrl: `https://${embeddedWalletHostname}`,

    // FOR traffic goes through the Entry Gateway host, same as Plan / Chained Actions.
    forApiUrl: overrides.forApiUrlOverride || getForApiUrl(),

    graphQLUrl:
      overrides.graphqlUrlOverride || getCloudflareApiBaseUrl({ flow: TrafficFlows.GraphQL, postfix: 'v1/graphql' }),

    liquidityServiceUrl:
      overrides.liquidityServiceUrlOverride ||
      (isE2eTestEnv()
        ? PROD_LIQUIDITY_SERVICE_URL
        : isDevEnv() || isBetaStaging
          ? STAGING_LIQUIDITY_SERVICE_URL
          : PROD_LIQUIDITY_SERVICE_URL),

    passkeysManagementUrl: `https://${embeddedWalletHostname}/manage/passkey`,

    privyEmbeddedWalletUrl: isE2eTestEnv()
      ? PROD_ENTRY_GATEWAY_API_BASE_URL
      : isBetaStaging
        ? STAGING_ENTRY_GATEWAY_API_BASE_URL
        : isDevEnv()
          ? DEV_ENTRY_GATEWAY_API_BASE_URL
          : PROD_ENTRY_GATEWAY_API_BASE_URL,

    // Privy REST endpoints
    // Docs: https://docs.privy.io/guide/api/encrypted-authorization-keys
    // Local dev (vite dev only) hits Privy directly; deployed/e2e use the cookie-wrapping proxy.
    privyEncryptedAuthorizationKeysUrl: isDevEnv()
      ? 'https://auth.privy.io/api/v1/encrypted_authorization_keys'
      : `https://privy.${embeddedWalletHostname}/api/v1/encrypted_authorization_keys`,

    scantasticApiUrl:
      overrides.scantasticApiUrlOverride ||
      getCloudflareApiBaseUrl({ flow: TrafficFlows.Scantastic, postfix: 'v2/scantastic' }),

    // On web, proxy through same-origin "/config" — the BFF (Hono) rewrites to the real Cloudflare URL.
    statsigProxyUrl:
      overrides.statsigProxyUrlOverride ||
      (isWebApp ? '/config' : getCloudflareApiBaseUrl({ flow: TrafficFlows.Gating, postfix: 'v1/statsig-proxy' })),

    // Trading traffic routes through the entry gateway (same as sessions/FOR/compliance); x-api-key
    // still applies and is forwarded through. Replaces the legacy trading-api-labs cloudflare host.
    tradingApiUrl: overrides.tradingApiUrlOverride || getEntryGatewayUrl(),
  }
}

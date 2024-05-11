/**
 * Known pages in the app. Highest order context.
 */
export enum InterfacePageName {
  ABOUT_PAGE = 'about-page',
  EXPLORE_PAGE = 'explore-page',
  LANDING_PAGE = 'landing-page',
  NFT_COLLECTION_PAGE = 'nft-collection-page',
  NFT_DETAILS_PAGE = 'nft-details-page',
  NFT_EXPLORE_PAGE = 'nft-explore-page',
  NFT_PROFILE_PAGE = 'nft-profile-page',
  NOT_FOUND = 'not-found',
  POOL_DETAILS_PAGE = 'pool-details-page',
  POOL_PAGE = 'pool-page',
  SWAP_PAGE = 'swap-page',
  TOKENS_PAGE = 'tokens-page',
  TOKEN_DETAILS_PAGE = 'token-details',
  VOTE_PAGE = 'vote-page',
}

/**
 * Sections. Disambiguates low-level elements that may share a name.
 * eg a `back` button in a modal will have the same `element`,
 * but a different `section`.
 */
export enum InterfaceSectionName {
  CURRENCY_INPUT_PANEL = 'swap-currency-input',
  CURRENCY_OUTPUT_PANEL = 'swap-currency-output',
  MINI_PORTFOLIO = 'mini-portfolio',
  NAVBAR_SEARCH = 'Navbar Search',
  WIDGET = 'widget',
}

/** Known modals for analytics purposes. */
export enum InterfaceModalName {
  CONFIRM_SWAP = 'confirm-swap-modal',
  NFT_LISTING = 'nft-listing-modal',
  NFT_TX_COMPLETE = 'nft-tx-complete-modal',
  TOKEN_SELECTOR = 'token-selector-modal',
}

/**
 * Known element names for analytics purposes.
 * Use to identify low-level components given a TraceContext
 */
export enum InterfaceElementName {
  ABOUT_PAGE_ANALYTICS_CARD = 'about-page-analytics-card',
  ABOUT_PAGE_BUY_CRYPTO_CARD = 'about-page-buy-crypto-card',
  ABOUT_PAGE_DEV_DOCS_CARD = 'about-page-dev-docs-card',
  ABOUT_PAGE_EARN_CARD = 'about-page-earn-card',
  ABOUT_PAGE_NFTS_CARD = 'about-page-nfts-card',
  ABOUT_PAGE_SWAP_CARD = 'about-page-swap-card',
  ABOUT_PAGE_SWAP_ELEMENT = 'about-page-swap-element',
  AUTOROUTER_VISUALIZATION_ROW = 'expandable-autorouter-visualization-row',
  BLOG_LINK = 'blog-link',
  CAREERS_LINK = 'careers-link',
  COMMON_BASES_CURRENCY_BUTTON = 'common-bases-currency-button',
  CONFIRM_SWAP_BUTTON = 'confirm-swap-or-send',
  CONNECT_WALLET_BUTTON = 'connect-wallet-button',
  CONTINUE_BUTTON = 'continue-button',
  DISCONNECT_WALLET_BUTTON = 'disconnect-wallet-button',
  DOCS_LINK = 'docs-link',
  EXPLORE_BANNER = 'explore-banner',
  EXPLORE_POOLS_TAB = 'explore-pools-tab',
  EXPLORE_SEARCH_INPUT = 'explore_search_input',
  EXPLORE_TOKENS_TAB = 'explore-tokens-tab',
  EXPLORE_TRANSACTIONS_TAB = 'explore-transactions-tab',
  FIAT_ON_RAMP_BUY_BUTTON = 'fiat-on-ramp-buy-button',
  FIAT_ON_RAMP_LEARN_MORE_LINK = 'fiat-on-ramp-learn-more-link',
  IMPORT_TOKEN_BUTTON = 'import-token-button',
  LANDING_PAGE_SWAP_ELEMENT = 'landing-page-swap-element',
  LEARN_MORE_LINK = 'learn-more-link',
  LEGACY_LANDING_PAGE_LINK = 'legacy-landing-page-link',
  MAX_TOKEN_AMOUNT_BUTTON = 'max-token-amount-button',
  MINI_PORTFOLIO_ACTIVITY_ROW = 'mini-portfolio-activity-row',
  MINI_PORTFOLIO_ACTIVITY_TAB = 'mini-portfolio-activity-tab',
  MINI_PORTFOLIO_NFT_ITEM = 'mini-portfolio-nft-item',
  MINI_PORTFOLIO_NFT_TAB = 'mini-portfolio-nft-tab',
  MINI_PORTFOLIO_POOLS_ROW = 'mini-portfolio-pools-row',
  MINI_PORTFOLIO_POOLS_TAB = 'mini-portfolio-pools-tab',
  MINI_PORTFOLIO_TOKENS_TAB = 'mini-portfolio-tokens-tab',
  MINI_PORTFOLIO_TOKEN_ROW = 'mini-portfolio-token-row',
  NAVBAR_SEARCH_INPUT = 'navbar-search-input',
  NFT_ACTIVITY_TAB = 'nft-activity-tab',
  NFT_BUY_BAG_PAY_BUTTON = 'nft-buy-bag-pay-button',
  NFT_FILTER_BUTTON = 'nft-filter-button',
  NFT_FILTER_OPTION = 'nft-filter-option',
  NFT_TRENDING_ROW = 'nft-trending-row',
  POOLS_TABLE_ROW = 'pools-table-row',
  PRICE_UPDATE_ACCEPT_BUTTON = 'price-update-accept-button',
  SUPPORT_LINK = 'support-link',
  SWAP_BUTTON = 'swap-button',
  SWAP_DETAILS_DROPDOWN = 'swap-details-dropdown',
  SWAP_TOKENS_REVERSE_ARROW_BUTTON = 'swap-tokens-reverse-arrow-button',
  TAX_SERVICE_BANNER_CTA_BUTTON = 'tax-service-banner-learn-more-button',
  TAX_SERVICE_COINTRACKER_BUTTON = 'tax-service-cointracker-link-button',
  TAX_SERVICE_TOKENTAX_BUTTON = 'tax-service-tokentax-link-button',
  TOKENS_TABLE_ROW = 'tokens-table-row',
  TOKEN_SELECTOR_ROW = 'token-selector-row',
  TWITTER_LINK = 'twitter-link',
  WALLET_TYPE_OPTION = 'wallet-type-option',
}

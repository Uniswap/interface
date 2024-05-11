/**
 * Docs page sections within pages, some shared across pages or for a specific page
 */
export enum DocsSectionName {
  BOTTOM_MENU_LINKS = 'Bottom Menu Links',
  DAPP_LINKS = 'DApp Links',
  DEVELOPER_LINKS = 'Developer Links',
  GETTING_STARTED_LINKS = 'Getting Started Links',
  QUICK_LINKS = 'Quick Links',
  SENTIMENT = 'Sentiment',
  SMART_CONTRACT_LINKS = 'Smart Contract Links',
  WELCOME_LINKS = 'Welcome Links',
}

/**
 * Protocol version, logged as a section in Navbar clicks
 */
export enum DocsProtocolVersion {
  V1 = 'V1',
  V2 = 'V2',
  V3 = 'V3',
}

/**
 * Homepage elements that can be clicked on
 */
export enum DocsHomepageElementName {
  BUILD_ORACLE = 'Build Oracle',
  DISCORD = 'Discord',
  EMBED_SWAP_WIDGET = 'Embed Swap Widget',
  FORUM = 'Forum',
  GITHUB = 'Github',
  GRANTS = 'Grants',
  IMPLEMENT_SWAP = 'Implement Swap',
  PROVIDE_LIQUIDITY = 'Provide Liquidity',
  SDK = 'SDK',
  SDK_QUICK_START = 'Sdk Quick Start',
  SMART_CONTRACTS = 'Smart Contracts',
  SMART_CONTRACT_OVERVIEW = 'Smart Contract Overview',
  V3_CONTRACT_ADDRESS = 'V3 Contract Address',
  V3_CORE = 'V3 Core',
  V3_PERIPHERY = 'V3 Periphery',
  V3_SDK = 'V3 SDK',
  V3_WIDGETS = 'V3 Widgets',
  WHITEPAPER = 'Whitepaper',
  WIDGETS = 'Widgets',
}

/**
 * Sentiment result, logged as an element
 */
export enum DocsSentiment {
  NEGATIVE_SENTIMENT = 'Negative Sentiment',
  NEUTRAL_SENTIMENT = 'Neutral Sentiment',
  POSITIVE_SENTIMENT = 'Positive Sentiment',
}

/**
 * Differentiating which section of a page sentiment is logged from
 */
export enum DocsSentimentSection {
  BOTTOM_SECTION = 'SENTIMENT_BOTTOM_SECTION',
  TOP_SECTION = 'SENTIMENT_TOP_SECTION',
}

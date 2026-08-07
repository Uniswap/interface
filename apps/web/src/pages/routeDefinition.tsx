import { ReactNode } from 'react'
import i18n from 'uniswap/src/i18n'

export interface RouterConfig {
  browserRouterEnabled?: boolean
  hash?: string
  isAddLiquidityRevampEnabled?: boolean
  isEmbeddedWalletEnabled?: boolean
}

// SEO titles and descriptions sourced from https://docs.google.com/spreadsheets/d/1_6vSxGgmsx6QGEZ4mdHppv1VkuiJEro3Y_IopxUHGB4/edit#gid=0
// getTitle and getDescription are used as static metatags for SEO. Dynamic metatags should be set in the page component itself
export const StaticTitlesAndDescriptions = {
  UniswapTitle: i18n.t('title.uniswapTradeCrypto'),
  SwapTitle: i18n.t('title.buySellTradeEthereum'),
  SwapDescription: i18n.t('title.swappingMadeSimple'),
  DetailsPageBaseTitle: i18n.t('common.buyAndSell'),
  TDPDescription: i18n.t('title.realTime'),
  PDPDescription: i18n.t('title.tradeTokens'),
  MigrateTitle: i18n.t('title.migratev2'),
  MigrateTitleV3: i18n.t('title.migratev3'),
  MigrateDescription: i18n.t('title.easilyRemove'),
  MigrateDescriptionV4: i18n.t('title.easilyRemoveV4'),
  AddLiquidityDescription: i18n.t('title.earnFees'),
  PasskeyManagementTitle: i18n.t('title.managePasskeys'),
  ToucanAuctionDescription: i18n.t('title.bidOnTokensInAuctions'),
  ToucanLaunchAuctionDescription: i18n.t('title.launchTokenAuction'),
}

export interface RouteDefinition {
  path: string
  nestedPaths: string[]
  getTitle: (path?: string) => string
  getDescription: (path?: string) => string
  enabled: (args: RouterConfig) => boolean
  getElement: (args: RouterConfig) => ReactNode
}

// Assigns the defaults to the route definition.
export function createRouteDefinition(route: Partial<RouteDefinition>): RouteDefinition {
  return {
    getElement: () => null,
    getTitle: () => StaticTitlesAndDescriptions.UniswapTitle,
    getDescription: () => StaticTitlesAndDescriptions.SwapDescription,
    enabled: () => true,
    path: '/',
    nestedPaths: [],
    // overwrite the defaults
    ...route,
  }
}

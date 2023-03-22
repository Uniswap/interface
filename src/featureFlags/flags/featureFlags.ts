/**
 * The value here must match the value in the statsig dashboard, if you plan to use statsig.
 */
export enum FeatureFlag {
  traceJsonRpc = 'traceJsonRpc',
  permit2 = 'permit2',
  payWithAnyToken = 'payWithAnyToken',
  swapWidget = 'swap_widget_replacement_enabled',
  statsigDummy = 'web_dummy_gate_amplitude_id',
  nftGraphql = 'nft_graphql_migration',
  taxService = 'tax_service_banner',
  mgtm = 'web_mobile_go_to_market_enabled',
  walletMicrosite = 'walletMicrosite',
  miniPortfolio = 'miniPortfolio',
}

import path from 'path'

export const Mocks = {
  FiatOnRamp: {
    get_country: path.resolve(__dirname, '../mocks/fiatOnRamp/get-country.json'),
    supported_fiat_currencies: path.resolve(__dirname, '../mocks/fiatOnRamp/supported-fiat-currencies.json'),
    supported_countries: path.resolve(__dirname, '../mocks/fiatOnRamp/supported-countries.json'),
    supported_tokens: path.resolve(__dirname, '../mocks/fiatOnRamp/supported-tokens.json'),
    quotes: path.resolve(__dirname, '../mocks/fiatOnRamp/quotes.json'),
  },
  UniswapX: {
    quote: path.resolve(__dirname, '../mocks/rest/uniswapX/quote.json'),
    openOrder: path.resolve(__dirname, '../mocks/rest/uniswapX/open_order.json'),
    openOrders: path.resolve(__dirname, '../mocks/rest/uniswapX/open_orders.json'),
    filledOrders: path.resolve(__dirname, '../mocks/rest/uniswapX/filled_orders.json'),
    cancelledOrders: path.resolve(__dirname, '../mocks/rest/uniswapX/cancelled_orders.json'),
    expiredOrders: path.resolve(__dirname, '../mocks/rest/uniswapX/expired_orders.json'),
  },
  Token: {
    search_token_tether: path.resolve(__dirname, '../mocks/graphql/Token/search_token_tether.json'),
    uni_token_price: path.resolve(__dirname, '../mocks/graphql/Token/uni_token_price.json'),
  },
  Search: {
    search_token_uni: path.resolve(__dirname, '../mocks/rest/search/search_token_uni.json'),
  },
  DataApiService: {
    get_portfolio: path.resolve(__dirname, '../mocks/dataApiService/get_portfolio.json'),
    get_wallet_nfts: path.resolve(__dirname, '../mocks/dataApiService/get_wallet_nfts.json'),
    get_wallet_nfts_empty: path.resolve(__dirname, '../mocks/dataApiService/get_wallet_nfts_empty.json'),
    get_portfolio_empty: path.resolve(__dirname, '../mocks/dataApiService/get_portfolio_empty.json'),
    get_wallet_balances_empty: path.resolve(__dirname, '../mocks/dataApiService/get_wallet_balances_empty.json'),
    get_wallet_balances_with_pools: path.resolve(
      __dirname,
      '../mocks/dataApiService/get_wallet_balances_with_pools.json',
    ),
    get_wallet_balances_pools_empty: path.resolve(
      __dirname,
      '../mocks/dataApiService/get_wallet_balances_pools_empty.json',
    ),
    get_portfolio_chart_with_pools: path.resolve(
      __dirname,
      '../mocks/dataApiService/get_portfolio_chart_with_pools.json',
    ),
    get_portfolio_chart_pools_empty: path.resolve(
      __dirname,
      '../mocks/dataApiService/get_portfolio_chart_pools_empty.json',
    ),
    get_token_warning: path.resolve(__dirname, '../mocks/dataApiService/get_token_warning.json'),
    get_token_sepolia_yay: path.resolve(__dirname, '../mocks/dataApiService/get_token_sepolia_yay.json'),
    get_rewards: path.resolve(__dirname, '../mocks/dataApiService/get_rewards.json'),
    get_rewards_empty: path.resolve(__dirname, '../mocks/dataApiService/get_rewards_empty.json'),
    list_launches: path.resolve(__dirname, '../mocks/dataApiService/list_launches.json'),
    list_launchpads: path.resolve(__dirname, '../mocks/dataApiService/list_launchpads.json'),
    list_transactions: path.resolve(__dirname, '../mocks/dataApiService/list_transactions.json'),
    list_transactions_empty: path.resolve(__dirname, '../mocks/dataApiService/list_transactions_empty.json'),
    list_transactions_uniswapx: path.resolve(__dirname, '../mocks/dataApiService/list_transactions_uniswapx.json'),
  },
  PoolPriceHistory: {
    eth_weeth: path.resolve(__dirname, '../mocks/graphql/PoolPriceHistory/eth_weeth.json'),
  },
  LiquidityService: {
    pool_info_eth_weeth: path.resolve(__dirname, '../mocks/liquidityService/pool_info_eth_weeth.json'),
    create_position_eth_weeth_low_slippage: path.resolve(
      __dirname,
      '../mocks/liquidityService/create_position_eth_weeth_low_slippage.json',
    ),
    create_position_eth_weeth_high_slippage: path.resolve(
      __dirname,
      '../mocks/liquidityService/create_position_eth_weeth_high_slippage.json',
    ),
    increase_position_eth_usdt: path.resolve(__dirname, '../mocks/liquidityService/increase_position_eth_usdt.json'),
    get_v4_position_multi_token_rewards: path.resolve(
      __dirname,
      '../mocks/liquidityService/get_v4_position_multi_token_rewards.json',
    ),
    get_v3_position: path.resolve(__dirname, '../mocks/liquidityService/get_v3_position.json'),
    get_wallet_positions: path.resolve(__dirname, '../mocks/liquidityService/get_wallet_positions.json'),
    get_wallet_positions_empty: path.resolve(__dirname, '../mocks/liquidityService/get_wallet_positions_empty.json'),
    get_wallet_positions_balance: path.resolve(
      __dirname,
      '../mocks/liquidityService/get_wallet_positions_balance.json',
    ),
    get_wallet_positions_balance_empty: path.resolve(
      __dirname,
      '../mocks/liquidityService/get_wallet_positions_balance_empty.json',
    ),
  },
  TradingApi: {
    swap: path.resolve(__dirname, '../mocks/tradingApi/swap.json'),
    quote_eth_usdt: path.resolve(__dirname, '../mocks/tradingApi/quote_eth_usdt.json'),
    swap_eth_usdt: path.resolve(__dirname, '../mocks/tradingApi/swap_eth_usdt.json'),
    check_approval_none: path.resolve(__dirname, '../mocks/tradingApi/check_approval_none.json'),
  },
  EmbeddedWallet: {
    list_authenticators_multi: path.resolve(__dirname, '../mocks/embeddedWallet/list_authenticators_multi.json'),
    list_authenticators_single: path.resolve(__dirname, '../mocks/embeddedWallet/list_authenticators_single.json'),
    start_authenticated_session: path.resolve(__dirname, '../mocks/embeddedWallet/start_authenticated_session.json'),
    add_authenticator: path.resolve(__dirname, '../mocks/embeddedWallet/add_authenticator.json'),
    delete_authenticator: path.resolve(__dirname, '../mocks/embeddedWallet/delete_authenticator.json'),
  },
}

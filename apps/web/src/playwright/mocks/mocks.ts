import path from 'path'

export const Mocks = {
  FiatOnRamp: {
    get_country: '../mocks/fiatOnRamp/get-country.json',
    supported_fiat_currencies: '../mocks/fiatOnRamp/supported-fiat-currencies.json',
    supported_countries: '../mocks/fiatOnRamp/supported-countries.json',
    supported_tokens: '../mocks/fiatOnRamp/supported-tokens.json',
    quotes: '../mocks/fiatOnRamp/quotes.json',
  },
  UniswapX: {
    quote: path.resolve(__dirname, '../mocks/rest/uniswapX/quote.json'),
    openOrder: path.resolve(__dirname, '../mocks/rest/uniswapX/open_order.json'),
    filledOrders: path.resolve(__dirname, '../mocks/rest/uniswapX/filled_orders.json'),
    expiredOrders: path.resolve(__dirname, '../mocks/rest/uniswapX/expired_orders.json'),
    activity: path.resolve(__dirname, '../mocks/graphql/UniswapX/uniswapx_activity.json'),
  },
  PortfolioBalances: {
    test_wallet: path.resolve(__dirname, '../mocks/graphql/PortfolioBalances/test_wallet.json'),
    hayden: path.resolve(__dirname, '../mocks/graphql/PortfolioBalances/hayden.json'),
  },
  Token: {
    token_warning: path.resolve(__dirname, '../mocks/graphql/Token/token_warning.json'),
    search_token_tether: path.resolve(__dirname, '../mocks/graphql/Token/search_token_tether.json'),
    uni_token: path.resolve(__dirname, '../mocks/graphql/Token/uni_token.json'),
    sepolia_yay_token: path.resolve(__dirname, '../mocks/graphql/Token/sepolia_yay_token.json'),
  },
  TokenProjects: {
    token_spam: path.resolve(__dirname, '../mocks/graphql/TokenProjects/token_warning.json'),
  },
  TokenWeb: {
    token_warning: path.resolve(__dirname, '../mocks/graphql/TokenWeb/token_warning.json'),
    uni_token: path.resolve(__dirname, '../mocks/graphql/TokenWeb/uni_token.json'),
    sepolia_yay_token: path.resolve(__dirname, '../mocks/graphql/TokenWeb/sepolia_yay_token.json'),
  },
  Positions: {
    get_single_sided_v3_position: path.resolve(__dirname, '../mocks/rest/positions/get_single_sided_v3_position.json'),
    get_v3_position: path.resolve(__dirname, '../mocks/rest/positions/get_v3_position.json'),
    get_v4_position: path.resolve(__dirname, '../mocks/rest/positions/get_v4_position.json'),
  },
  Account: {
    tokens: path.resolve(__dirname, '../mocks/graphql/Account/tokens.json'),
    nfts: path.resolve(__dirname, '../mocks/graphql/Account/nfts.json'),
    full_activity_history: path.resolve(__dirname, '../mocks/graphql/Account/full_activity.json'),
    activity_history: path.resolve(__dirname, '../mocks/graphql/Account/activity_history.json'),
  },
}

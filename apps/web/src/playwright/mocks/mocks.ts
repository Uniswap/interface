import path from 'path'

export const Mocks = {
  FiatOnRamp: {
    get_country: '../mocks/fiatOnRamp/get-country.json',
    supported_fiat_currencies: '../mocks/fiatOnRamp/supported-fiat-currencies.json',
    supported_countries: '../mocks/fiatOnRamp/supported-countries.json',
    supported_tokens: '../mocks/fiatOnRamp/supported-tokens.json',
    quotes: '../mocks/fiatOnRamp/quotes.json',
  },
  PortfolioBalances: {
    test_wallet: path.resolve(__dirname, '../mocks/graphql/PortfolioBalances/test_wallet.json'),
  },
  Token: {
    token_warning: path.resolve(__dirname, '../mocks/graphql/Token/token_warning.json'),
  },
  TokenProjects: {
    token_spam: path.resolve(__dirname, '../mocks/graphql/TokenProjects/token_warning.json'),
  },
  TokenWeb: {
    token_warning: path.resolve(__dirname, '../mocks/graphql/TokenWeb/token_warning.json'),
  },
  Positions: {
    get_position: path.resolve(__dirname, '../mocks/rest/positions/get_position.json'),
  },
}

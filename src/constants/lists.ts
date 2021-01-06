// the Uniswap Default token list lives here
export const DEFAULT_TOKEN_LIST_URL = {
  uniswap: 'tokens.uniswap.eth',
  sushiswap: 'https://raw.githubusercontent.com/sushiswapclassic/token-list/master/sushiswap.tokenlist.json'
}
// the SushiSwap Default token list lives here
export const SUSHISWAP_DEFAULT_TOKEN_LIST_URL =
  'https://raw.githubusercontent.com/sushiswapclassic/token-list/master/sushiswap.tokenlist.json'

// export const DEFAULT_LIST_OF_LISTS: string[] = [
//   DEFAULT_TOKEN_LIST_URL,
//   't2crtokens.eth', // kleros
//   'tokens.1inch.eth', // 1inch
//   'synths.snx.eth',
//   'tokenlist.dharma.eth',
//   'defi.cmc.eth',
//   'erc20.cmc.eth',
//   'stablecoin.cmc.eth',
//   'tokenlist.zerion.eth',
//   'tokenlist.aave.eth',
//   'https://tokens.coingecko.com/uniswap/all.json',
//   'https://app.tryroll.com/tokens.json',
//   'https://raw.githubusercontent.com/compound-finance/token-list/master/compound.tokenlist.json',
//   'https://defiprime.com/defiprime.tokenlist.json',
//   'https://umaproject.org/uma.tokenlist.json'
// ]

export const DEFAULT_LIST_OF_LISTS = {
  uniswap: [
    DEFAULT_TOKEN_LIST_URL['uniswap'],
    't2crtokens.eth', // kleros
    'tokens.1inch.eth', // 1inch
    'synths.snx.eth',
    'tokenlist.dharma.eth',
    'defi.cmc.eth',
    'erc20.cmc.eth',
    'stablecoin.cmc.eth',
    'tokenlist.zerion.eth',
    'tokenlist.aave.eth',
    'https://tokens.coingecko.com/uniswap/all.json',
    'https://app.tryroll.com/tokens.json',
    'https://raw.githubusercontent.com/compound-finance/token-list/master/compound.tokenlist.json',
    'https://defiprime.com/defiprime.tokenlist.json',
    'https://umaproject.org/uma.tokenlist.json'
  ],
  sushiswap: [
    DEFAULT_TOKEN_LIST_URL['sushiswap'],
    // 't2crtokens.eth', // kleros
    'tokens.1inch.eth', // 1inch
    // 'synths.snx.eth',
    // 'tokenlist.dharma.eth',
    // 'defi.cmc.eth',
    // 'erc20.cmc.eth',
    // 'stablecoin.cmc.eth',
    // 'tokenlist.zerion.eth',
    // 'tokenlist.aave.eth',
    'https://www.coingecko.com/tokens_list/uniswap/defi_100/v_0_0_0.json',
    // 'https://app.tryroll.com/tokens.json',
    'https://raw.githubusercontent.com/compound-finance/token-list/master/compound.tokenlist.json'
    // 'https://defiprime.com/defiprime.tokenlist.json',
    // 'https://umaproject.org/uma.tokenlist.json'
  ]
}

export const DEFAULT_TOKEN_LIST_URL = String(process.env.REACT_APP_CRYPTO_TOKEN_LIST_URL)

if (typeof DEFAULT_TOKEN_LIST_URL === 'undefined') {
  throw new Error(`REACT_APP_CRYPTO_TOKEN_LIST_URL is missing`)
}

export const DEFAULT_LIST_OF_LISTS: string[] = [
  DEFAULT_TOKEN_LIST_URL
  /*
  't2crtokens.eth', // kleros
  'tokens.1inch.eth', // 1inch
  'synths.snx.eth',
  'tokenlist.dharma.eth',
  'defi.cmc.eth',
  'erc20.cmc.eth',
  'stablecoin.cmc.eth',
  'tokenlist.zerion.eth',
  'tokenlist.aave.eth',
  'https://app.tryroll.com/tokens.json',
  'https://raw.githubusercontent.com/compound-finance/token-list/master/compound.tokenlist.json',
  'https://defiprime.com/defiprime.tokenlist.json',
  'https://umaproject.org/uma.tokenlist.json'
  */
]

import { CELO, ChainId, cUSD, JSBI, Percent, Token } from '@ubeswap/sdk'

import { UBE } from './tokens'

export { UBE } from './tokens'

export const ROUTER_ADDRESS = '0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121'

export const UBESWAP_MOOLA_ROUTER_ADDRESS = '0x7d28570135a2b1930f331c507f65039d4937f66c'

export const MINIMA_ROUTER_ADDRESS = '0xa730B463395f5ca07EcE5cefeccF7f45e1E2C9Bf'

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

// a list of tokens by chain
type ChainTokenList = {
  // readonly [chainId in ChainId]: Token[]
  readonly [chainId: number]: Token[]
}

// Block time here is slightly higher (~1s) than average in order to avoid ongoing proposals past the displayed time
export const AVERAGE_BLOCK_TIME_IN_SECS = 13
export const PROPOSAL_LENGTH_IN_BLOCKS = 40_320
export const PROPOSAL_LENGTH_IN_SECS = AVERAGE_BLOCK_TIME_IN_SECS * PROPOSAL_LENGTH_IN_BLOCKS

export const LIMIT_ORDER_ADDRESS = {
  [ChainId.MAINNET]: '0x83013dCE53676F523dB8175832f2f3AD5B1fBb1f',
  [ChainId.ALFAJORES]: '0xb5911e904EEf100803D5d4bDb22ff1177324e7F3',
  [ChainId.BAKLAVA]: '',
}

export const ORDER_BOOK_ADDRESS = {
  [ChainId.MAINNET]: '0x55e0E091a5a6f178B1b225E7369E8C91d4F64992',
  [ChainId.ALFAJORES]: '0x12553790998fa8d3CCCC2906192267576130DD3f',
  [ChainId.BAKLAVA]: '',
}

export const ORDER_BOOK_REWARD_DISTRIBUTOR_ADDRESS = {
  [ChainId.MAINNET]: '0x3c57D786BdC33D30de25fE3f8b3fD3Fd3ff503e3',
  [ChainId.ALFAJORES]: '0x39F2854fC1786Bb0d0883FAf0F2a1c2fb458bCA8',
  [ChainId.BAKLAVA]: '',
}

export const MULTICALL_ADDRESS = {
  [ChainId.MAINNET]: '0x75f59534dd892c1f8a7b172d639fa854d529ada3',
  [ChainId.ALFAJORES]: '0x387ce7960b5DA5381De08Ea4967b13a7c8cAB3f6',
  [ChainId.BAKLAVA]: '',
}

export const POOF = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, '0x00400FcbF0816bebB94654259de7273f4A05c762', 18, 'POOF', 'POOF'),
  [ChainId.ALFAJORES]: new Token(ChainId.ALFAJORES, '0x00400FcbF0816bebB94654259de7273f4A05c762', 18, 'POOF', 'POOF'),
}

export const MCREAL = {
  [ChainId.MAINNET]: new Token(
    ChainId.MAINNET,
    '0x9802d866fdE4563d088a6619F7CeF82C0B991A55',
    18,
    'mCREAL',
    'Moola cREAL'
  ),
  [ChainId.ALFAJORES]: new Token(
    ChainId.ALFAJORES,
    '0x3D0EDA535ca4b15c739D46761d24E42e37664Ad7',
    18,
    'mCREAL',
    'Moola cREAL'
  ),
}

export const MCUSD = {
  [ChainId.MAINNET]: new Token(
    ChainId.MAINNET,
    '0x918146359264C492BD6934071c6Bd31C854EDBc3',
    18,
    'mCUSD',
    'Moola cUSD'
  ),
  [ChainId.ALFAJORES]: new Token(
    ChainId.ALFAJORES,
    '0x71DB38719f9113A36e14F409bAD4F07B58b4730b',
    18,
    'mCUSD',
    'Moola cUSD'
  ),
  [ChainId.BAKLAVA]: null,
}

export const MCELO = {
  [ChainId.MAINNET]: new Token(
    ChainId.MAINNET,
    '0x7D00cd74FF385c955EA3d79e47BF06bD7386387D',
    18,
    'mCELO',
    'Moola CELO'
  ),
  [ChainId.ALFAJORES]: new Token(
    ChainId.ALFAJORES,
    '0x86f61EB83e10e914fc6F321F5dD3c2dD4860a003',
    18,
    'mCELO',
    'Moola CELO'
  ),
}

export const MCEUR = {
  [ChainId.MAINNET]: new Token(
    ChainId.MAINNET,
    '0xE273Ad7ee11dCfAA87383aD5977EE1504aC07568',
    18,
    'mCEUR',
    'Moola Celo Euro'
  ),
  [ChainId.ALFAJORES]: new Token(
    ChainId.ALFAJORES,
    '0x32974C7335e649932b5766c5aE15595aFC269160',
    18,
    'mCEUR',
    'Moola Celo Euro'
  ),
}

export const CEUR = {
  [ChainId.ALFAJORES]: new Token(
    ChainId.ALFAJORES,
    '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
    18,
    'cEUR',
    'Celo Euro'
  ),
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73', 18, 'cEUR', 'Celo Euro'),
}

// used to construct intermediary pairs for trading
export const BASES_TO_CHECK_TRADES_AGAINST: ChainTokenList = {
  [ChainId.MAINNET]: [cUSD, CELO, CEUR, UBE, MCUSD, MCEUR, MCELO, POOF].map((el) => el[ChainId.MAINNET]),
  [ChainId.ALFAJORES]: [cUSD, CELO, CEUR].map((el) => el[ChainId.ALFAJORES]),
  [ChainId.BAKLAVA]: [cUSD, CELO].map((el) => el[ChainId.BAKLAVA]),
}

// used for display in the default list when adding liquidity
export const SUGGESTED_BASES: ChainTokenList = {
  ...BASES_TO_CHECK_TRADES_AGAINST,
  [ChainId.MAINNET]: [MCUSD, MCEUR, CELO].map((el) => el[ChainId.MAINNET]),
  [ChainId.ALFAJORES]: [MCUSD, MCEUR, CELO].map((el) => el[ChainId.ALFAJORES]),
}

// used to construct the list of all pairs we consider by default in the frontend
export const BASES_TO_TRACK_LIQUIDITY_FOR: ChainTokenList = BASES_TO_CHECK_TRADES_AGAINST

export const PINNED_PAIRS: { [chainId: number]: [Token, Token][] } = {
  [ChainId.MAINNET]: [
    [cUSD, CELO],
    [MCUSD, CELO],
    [MCEUR, CELO],
    [MCUSD, UBE],
    [MCEUR, UBE],
  ].map((el) => el.map((t) => t[ChainId.MAINNET]) as [Token, Token]),
  [ChainId.ALFAJORES]: [
    [cUSD, CELO],
    [MCUSD, CELO],
  ].map((el) => el.map((t) => t[ChainId.ALFAJORES]) as [Token, Token]),
  [ChainId.BAKLAVA]: [[cUSD[ChainId.BAKLAVA], CELO[ChainId.BAKLAVA]]],
}

export const NetworkContextName = 'NETWORK'

// default allowed slippage, in bips
export const INITIAL_ALLOWED_SLIPPAGE = 50
// 20 minutes, denominated in seconds
export const DEFAULT_DEADLINE_FROM_NOW = 60 * 20

// used for rewards deadlines
export const BIG_INT_SECONDS_IN_WEEK = JSBI.BigInt(60 * 60 * 24 * 7)

export const INT_SECONDS_IN_WEEK = 60 * 60 * 24 * 7

export const BIG_INT_SECONDS_IN_YEAR = JSBI.BigInt(60 * 60 * 24 * 365)

export const BIG_INT_ZERO = JSBI.BigInt(0)

// one basis point
export const ONE_BIPS = new Percent(JSBI.BigInt(1), JSBI.BigInt(10000))
export const BIPS_BASE = JSBI.BigInt(10000)
// used for warning states
export const ALLOWED_PRICE_IMPACT_LOW: Percent = new Percent(JSBI.BigInt(100), BIPS_BASE) // 1%
export const ALLOWED_PRICE_IMPACT_MEDIUM: Percent = new Percent(JSBI.BigInt(300), BIPS_BASE) // 3%
export const ALLOWED_PRICE_IMPACT_HIGH: Percent = new Percent(JSBI.BigInt(500), BIPS_BASE) // 5%
// if the price slippage exceeds this number, force the user to type 'confirm' to execute
export const PRICE_IMPACT_WITHOUT_FEE_CONFIRM_MIN: Percent = new Percent(JSBI.BigInt(1000), BIPS_BASE) // 10%
// for non expert mode disable swaps above this
export const BLOCKED_PRICE_IMPACT_NON_EXPERT: Percent = new Percent(JSBI.BigInt(1500), BIPS_BASE) // 15%

// used to ensure the user doesn't send so much ETH so they end up with <.01
export const MIN_ETH: JSBI = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(16)) // .01 ETH
export const BETTER_TRADE_LESS_HOPS_THRESHOLD = new Percent(JSBI.BigInt(50), JSBI.BigInt(10000))

export const ZERO_PERCENT = new Percent('0')
export const ONE_HUNDRED_PERCENT = new Percent('1')

export const IMPORTED_FARMS = 'imported_farms'

export const MINIMA_API_URL = 'https://router.nodefinance.org/routes'

export const FETCH_MINIMA_ROUTER_TIMER = 5000

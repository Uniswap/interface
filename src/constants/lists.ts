import { ChainId } from '@dynamic-amm/sdk'

// used to mark unsupported tokens, these are hosted lists of unsupported tokens

const COMPOUND_LIST = 'https://raw.githubusercontent.com/compound-finance/token-list/master/compound.tokenlist.json'
const UMA_LIST = 'https://umaproject.org/uma.tokenlist.json'
const AAVE_LIST = 'tokenlist.aave.eth'
const SYNTHETIX_LIST = 'synths.snx.eth'
const WRAPPED_LIST = 'wrapped.tokensoft.eth'
const SET_LIST = 'https://raw.githubusercontent.com/SetProtocol/uniswap-tokenlist/main/set.tokenlist.json'
const OPYN_LIST = 'https://raw.githubusercontent.com/opynfinance/opyn-tokenlist/master/opyn-v1.tokenlist.json'
const ROLL_LIST = 'https://app.tryroll.com/tokens.json'
const CMC_ALL_LIST = 'defi.cmc.eth'
const CMC_STABLECOIN = 'stablecoin.cmc.eth'
const KLEROS_LIST = 't2crtokens.eth'
const GEMINI_LIST = 'https://www.gemini.com/uniswap/manifest.json'
const BA_LIST = 'https://raw.githubusercontent.com/The-Blockchain-Association/sec-notice-list/master/ba-sec-list.json'
const QUICK_SWAP = 'https://unpkg.com/quickswap-default-token-list@1.0.67/build/quickswap-default.tokenlist.json'
const PANCAKE_EXTENDED = 'https://tokens.pancakeswap.finance/pancakeswap-extended.json'
const PANCAKE_TOP100 = 'https://tokens.pancakeswap.finance/pancakeswap-top-100.json'
const PANGOLIN = 'https://raw.githubusercontent.com/pangolindex/tokenlists/main/ab.tokenlist.json'
const SPOOKY = 'https://raw.githubusercontent.com/SpookySwap/spooky-info/master/src/constants/token/spookyswap.json'
const COINGECKO = 'https://tokens.coingecko.com/uniswap/all.json'
const AURORA = 'https://raw.githubusercontent.com/aurora-is-near/bridge-assets/master/assets/aurora.tokenlist.json'
const ARBITRUM = 'https://bridge.arbitrum.io/token-list-42161.json'

export const UNSUPPORTED_LIST_URLS: string[] = [BA_LIST]
export const BYPASS_LIST = [PANGOLIN, SPOOKY, ARBITRUM]
// lower index == higher priority for token import
export const DEFAULT_LIST_OF_LISTS: string[] = [
  COINGECKO,
  COMPOUND_LIST,
  AAVE_LIST,
  SYNTHETIX_LIST,
  UMA_LIST,
  WRAPPED_LIST,
  SET_LIST,
  OPYN_LIST,
  ROLL_LIST,
  CMC_ALL_LIST,
  CMC_STABLECOIN,
  KLEROS_LIST,
  GEMINI_LIST,
  QUICK_SWAP,
  PANCAKE_TOP100,
  PANCAKE_EXTENDED,
  PANGOLIN,
  SPOOKY,
  AURORA,
  ARBITRUM,
  ...UNSUPPORTED_LIST_URLS, // need to load unsupported tokens as well
]

export const MATIC_TOKEN_LISTS: string[] = [QUICK_SWAP]
export const BSC_TOKEN_LISTS: string[] = [PANCAKE_TOP100, PANCAKE_EXTENDED]
export const AVAX_TOKEN_LISTS: string[] = []
export const FANTOM_TOKEN_LISTS: string[] = []
export const CRONOS_TOKEN_LISTS: string[] = []
export const AURORA_TOKEN_LISTS: string[] = [AURORA]

export const LIST_OF_LISTS: Map<ChainId, string[]> = new Map([
  [
    ChainId.MAINNET,
    [
      COINGECKO,
      COMPOUND_LIST,
      AAVE_LIST,
      SYNTHETIX_LIST,
      UMA_LIST,
      WRAPPED_LIST,
      SET_LIST,
      OPYN_LIST,
      ROLL_LIST,
      CMC_ALL_LIST,
      CMC_STABLECOIN,
      KLEROS_LIST,
      GEMINI_LIST,
    ],
  ],
  [
    ChainId.ROPSTEN,
    [
      COINGECKO,
      COMPOUND_LIST,
      AAVE_LIST,
      SYNTHETIX_LIST,
      UMA_LIST,
      WRAPPED_LIST,
      SET_LIST,
      OPYN_LIST,
      ROLL_LIST,
      CMC_ALL_LIST,
      CMC_STABLECOIN,
      KLEROS_LIST,
      GEMINI_LIST,
    ],
  ],
  [ChainId.MATIC, [QUICK_SWAP]],
  [ChainId.MUMBAI, [QUICK_SWAP]],
  [ChainId.BSCMAINNET, [PANCAKE_TOP100, PANCAKE_EXTENDED]],
  [ChainId.BSCTESTNET, [PANCAKE_TOP100, PANCAKE_EXTENDED]],
  [ChainId.AVAXMAINNET, []],
  [ChainId.AVAXTESTNET, []],
  [ChainId.FANTOM, []],
  [ChainId.CRONOS, []],
  [ChainId.CRONOSTESTNET, []],
  [ChainId.AURORA, []],
])
export const ARBITRUM_TOKEN_LISTS: string[] = [ARBITRUM]
export const BTTC_TOKEN_LISTS: string[] = []
export const VELAS_TOKEN_LISTS: string[] = []
export const OASIS_TOKEN_LISTS: string[] = []
// default lists to be 'active' aka searched across
export const DEFAULT_ACTIVE_LIST_URLS: string[] = [ARBITRUM]

export const HIDE_LIST = [COINGECKO]

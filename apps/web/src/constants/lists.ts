/* eslint-disable import/no-unused-modules */
import { UniverseChainId } from 'uniswap/src/features/chains/types'

// Lists we use as fallbacks on chains that our backend doesn't support
const COINGECKO_AVAX_LIST = 'https://tokens.coingecko.com/avalanche/all.json'
const UNISWAP_MAINNET_LIST = 'https://raw.githubusercontent.com/Uniswap/default-token-list/main/src/tokens/mainnet.json'
const RING_LIST = 'https://raw.githubusercontent.com/RingProtocol/token-list/master/ringx.tokenlist.json'
const FEWTOKEN_LIST =
  process.env.REACT_APP_FEWTOKEN_LIST_URL ??
  'https://raw.githubusercontent.com/RingProtocol/token-list/master/fewtokenlist.json'
const RING_BASE_LIST = 'https://raw.githubusercontent.com/RingProtocol/token-list/master/base.tokenlist.json'
const RING_ARBITRUM_LIST = 'https://raw.githubusercontent.com/RingProtocol/token-list/master/arbitrum.tokenlist.json'
const RING_OPTIMISM_LIST = 'https://raw.githubusercontent.com/RingProtocol/token-list/master/optimism.tokenlist.json'
const RING_BNB_LIST = 'https://raw.githubusercontent.com/RingProtocol/token-list/master/bnb.tokenlist.json'
const RING_UNICHAIN_LIST = 'https://raw.githubusercontent.com/RingProtocol/token-list/master/unichain.tokenlist.json'
const RING_HYPER_LIST = 'https://raw.githubusercontent.com/RingProtocol/token-list/master/hyper.tokenlist.json'
const RING_XLAYER_LIST = 'https://raw.githubusercontent.com/RingProtocol/token-list/master/xlayer.tokenlist.json'

export const LEGACY_ARRAY_TOKEN_LIST_CHAIN_IDS: Record<string, UniverseChainId> = {
  [RING_BASE_LIST]: UniverseChainId.Base,
  [RING_ARBITRUM_LIST]: UniverseChainId.ArbitrumOne,
  [RING_OPTIMISM_LIST]: UniverseChainId.Optimism,
  [RING_BNB_LIST]: UniverseChainId.Bnb,
  [RING_UNICHAIN_LIST]: UniverseChainId.Unichain,
  [RING_HYPER_LIST]: UniverseChainId.HyperMainnet,
  [RING_XLAYER_LIST]: UniverseChainId.XLayer,
}

const RING_CHAIN_TOKEN_LIST_URLS: string[] = [
  RING_BASE_LIST,
  RING_ARBITRUM_LIST,
  RING_OPTIMISM_LIST,
  RING_BNB_LIST,
  RING_UNICHAIN_LIST,
  RING_HYPER_LIST,
  RING_XLAYER_LIST,
]

export const DEFAULT_INACTIVE_LIST_URLS: string[] = [
  COINGECKO_AVAX_LIST,
  UNISWAP_MAINNET_LIST,
  RING_LIST,
  FEWTOKEN_LIST,
  ...RING_CHAIN_TOKEN_LIST_URLS,
].filter(Boolean)

export const RING_DEFAULT_ACTIVE_LIST_URLS: string[] = [RING_LIST, UNISWAP_MAINNET_LIST, ...RING_CHAIN_TOKEN_LIST_URLS]
export const FEWTOKEN_DEFAULT_ACTIVE_LIST_URLS: string[] = FEWTOKEN_LIST ? [FEWTOKEN_LIST] : []

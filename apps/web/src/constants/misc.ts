/* eslint-disable import/no-unused-modules */
import { Percent } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export const FEW_V2_FACTORY_ADDRESSES: { [chainId: number]: string } = {
  [UniverseChainId.Mainnet]: '0xeb2A625B704d73e82946D8d026E1F588Eed06416',
  // [UniverseChainId.GOERLI]: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f', // use uniswap v2 factory address
  [UniverseChainId.Sepolia]: '0x3D7101fDe92D0961cAc4b39Ee5A638d7B6A88090',
  [UniverseChainId.Optimism]: '0x0c3c1c532F1e39EdF36BE9Fe0bE1410313E074Bf', // use uniswap v2 factory address
  [UniverseChainId.ArbitrumOne]: '0x1246Fa62467a9AC0892a2d2A9F9aafC2F5609442',
  [UniverseChainId.Avalanche]: '0x9e5A52f57b3038F1B8EeE45F28b3C1967e22799C', // use uniswap v2 factory address
  // [UniverseChainId.BASE_SEPOLIA]: '0x7Ae58f10f7849cA6F5fB71b7f45CB416c9204b1e', // use uniswap v2 factory address
  [UniverseChainId.Base]: '0x9BfFC3B30D6659e3D84754cc38865B3D60B4980E',
  [UniverseChainId.Bnb]: '0x4De602A30Ad7fEf8223dcf67A9fB704324C4dd9B',
  [UniverseChainId.Polygon]: '0x9e5A52f57b3038F1B8EeE45F28b3C1967e22799C', // use uniswap v2 factory address
  [UniverseChainId.Celo]: '0x79a530c8e2fA8748B7B40dd3629C0520c2cCf03f', // use uniswap v2 factory address
  [UniverseChainId.Blast]: '0x24F5Ac9A706De0cF795A8193F6AB3966B14ECfE6',
  [UniverseChainId.WorldChain]: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f', // use uniswap v2 factory address
  [UniverseChainId.UnichainSepolia]: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f', // use uniswap v2 factory address
  [UniverseChainId.Unichain]: '0xEeE400Eabfba8F60f4e6B351D8577394BeB972CD',
  [UniverseChainId.MonadTestnet]: '0x733e88f248b742db6c14c0b1713af5ad7fdd59d0', // use uniswap v2 factory address
  [UniverseChainId.Soneium]: '0x97febbc2adbd5644ba22736e962564b23f5828ce', // use uniswap v2 factory address
  [UniverseChainId.HyperMainnet]: '0x4AfC2e4cA0844ad153B090dc32e207c1DD74a8E4',
  [UniverseChainId.XLayer]: '0x630DB8E822805c82Ca40a54daE02dd5aC31f7fcF',
  [UniverseChainId.MEGAETHMainnet]: '0x47C436602d2598d0ef4b50888F29a528B6Bccc95',
  // [UniverseChainId.StoryOdyssey]: '0x13429d9780662560F526Ba0DA751C191DFdF1849',
  // [UniverseChainId.StoryMainnet]: '0xEeE400Eabfba8F60f4e6B351D8577394BeB972CD',
  // [UniverseChainId.BlastSepolia]: '0xe4aa82591AD0E8AbFD15ca2A2ff74439c6052Fbf',
  // [UniverseChainId.ArbitrumSepolia]: '0x13429d9780662560F526Ba0DA751C191DFdF1849',
}

export const FEW_INIT_CODE_HASH_MAP: { [chainId: number]: string } = {
  // Sepolia
  11155111: '0xa7ae6a5ec37f0c21bbdac560794258c4089b8ae3ffa6e3909b53c6091764a676',
  // Blast Sepolia
  168587773: '0x4b1dab7451c20e74482652f09a8ac942d2127aa266ba46f8ec97735f05664521',
  // Blast Mainnet
  81457: '0x501ce753061ab6e75837b15f074633bb775f5972f8dc1112fcc829c2e88dc689',
  // Ethereum Mainnet
  1: '0xa7ae6a5ec37f0c21bbdac560794258c4089b8ae3ffa6e3909b53c6091764a676',
  // unichain sepolia
  1301: '0xa7ae6a5ec37f0c21bbdac560794258c4089b8ae3ffa6e3909b53c6091764a676',
  // unichain
  130: '0xa7ae6a5ec37f0c21bbdac560794258c4089b8ae3ffa6e3909b53c6091764a676',
  // arbitrum sepolia
  421614: '0xa7ae6a5ec37f0c21bbdac560794258c4089b8ae3ffa6e3909b53c6091764a676',
  // base
  8453: '0xa7ae6a5ec37f0c21bbdac560794258c4089b8ae3ffa6e3909b53c6091764a676',
  // arbitrum mainnet
  42161: '0xa7ae6a5ec37f0c21bbdac560794258c4089b8ae3ffa6e3909b53c6091764a676',
  // story odysey
  1516: '0xa7ae6a5ec37f0c21bbdac560794258c4089b8ae3ffa6e3909b53c6091764a676',
  // story mainnet
  1514: '0xa7ae6a5ec37f0c21bbdac560794258c4089b8ae3ffa6e3909b53c6091764a676',
  // bnb chain
  56: '0xa7ae6a5ec37f0c21bbdac560794258c4089b8ae3ffa6e3909b53c6091764a676',
  // hyper mainnet
  999: '0xa7ae6a5ec37f0c21bbdac560794258c4089b8ae3ffa6e3909b53c6091764a676',
  // rootstock
  30: '0xa7ae6a5ec37f0c21bbdac560794258c4089b8ae3ffa6e3909b53c6091764a676',
  // polygon mainnet
  137: '0xa7ae6a5ec37f0c21bbdac560794258c4089b8ae3ffa6e3909b53c6091764a676',
  // optimism
  10: '0xa7ae6a5ec37f0c21bbdac560794258c4089b8ae3ffa6e3909b53c6091764a676',
  // avalanche
  43114: '0xa7ae6a5ec37f0c21bbdac560794258c4089b8ae3ffa6e3909b53c6091764a676',
  // worldchain
  480: '0xa7ae6a5ec37f0c21bbdac560794258c4089b8ae3ffa6e3909b53c6091764a676',
  // zksync
  324: '0xa7ae6a5ec37f0c21bbdac560794258c4089b8ae3ffa6e3909b53c6091764a676',
  // soneium
  1868: '0xa7ae6a5ec37f0c21bbdac560794258c4089b8ae3ffa6e3909b53c6091764a676',
  // zora
  7777777: '0xa7ae6a5ec37f0c21bbdac560794258c4089b8ae3ffa6e3909b53c6091764a676',
  // zora sepolia
  999999999: '0xa7ae6a5ec37f0c21bbdac560794258c4089b8ae3ffa6e3909b53c6091764a676',
  // celo
  42220: '0xa7ae6a5ec37f0c21bbdac560794258c4089b8ae3ffa6e3909b53c6091764a676',
  // megaeth mainnet
  4326: '0xa7ae6a5ec37f0c21bbdac560794258c4089b8ae3ffa6e3909b53c6091764a676',
}

// TODO(WEB-1984): Convert the deadline to minutes and remove unecessary conversions from
// seconds to minutes in the codebase.
// 10 minutes, denominated in seconds
export const DEFAULT_DEADLINE_FROM_NOW = 60 * 10
export const L2_DEADLINE_FROM_NOW = 60 * 5

// transaction popup dismissal amounts
export const DEFAULT_TXN_DISMISS_MS = 10000
export const L2_TXN_DISMISS_MS = 5000

export const BIG_INT_ZERO = JSBI.BigInt(0)

export const BIPS_BASE = 10_000

// used for warning states
export const ALLOWED_PRICE_IMPACT_LOW: Percent = new Percent(1, 100) // 1%
export const ALLOWED_PRICE_IMPACT_MEDIUM: Percent = new Percent(3, 100) // 3%
export const ALLOWED_PRICE_IMPACT_HIGH: Percent = new Percent(5, 100) // 5%
// for non expert mode disable swaps above this
export const BLOCKED_PRICE_IMPACT_NON_EXPERT: Percent = new Percent(15, 100) // 15%

export const ZERO_PERCENT = new Percent(0)
export const ONE_HUNDRED_PERCENT = new Percent(1)

export const INTERNAL_JSON_RPC_ERROR_CODE = -32603

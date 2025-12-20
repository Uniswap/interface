import { Currency, NativeCurrency, Token, UNI_ADDRESSES, WETH9 } from '@uniswap/sdk-core'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { ARBITRUM_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/arbitrum'
import { AVALANCHE_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/avalanche'
import { BASE_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/base'
import { BLAST_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/blast'
import { BNB_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/bnb'
import { CELO_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/celo'
import { MAINNET_CHAIN_INFO, SEPOLIA_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/mainnet'
import { MONAD_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/monad'
import { OPTIMISM_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/optimism'
import { POLYGON_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/polygon'
import { SONEIUM_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/soneium'
import { UNICHAIN_CHAIN_INFO, UNICHAIN_SEPOLIA_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/unichain'
import { WORLD_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/worldchain'
import { ZKSYNC_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/zksync'
import { ZORA_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/zora'
import { WRAPPED_SOL_ADDRESS_SOLANA } from 'uniswap/src/features/chains/svm/defaults'
import { SOLANA_CHAIN_INFO } from 'uniswap/src/features/chains/svm/info/solana'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { SolanaToken } from 'uniswap/src/features/tokens/SolanaToken'
import { logger } from 'utilities/src/logger/logger'

export const { USDC: USDC_MONAD, AUSD: AUSD_MONAD } = MONAD_CHAIN_INFO.tokens

export const { USDC: USDC_SEPOLIA } = SEPOLIA_CHAIN_INFO.tokens

export const { USDC: USDC_UNICHAIN } = UNICHAIN_CHAIN_INFO.tokens

export const { USDC: USDC_UNICHAIN_SEPOLIA } = UNICHAIN_SEPOLIA_CHAIN_INFO.tokens

export const { USDC: USDC_SONEIUM } = SONEIUM_CHAIN_INFO.tokens

export const { DAI } = MAINNET_CHAIN_INFO.tokens

export const { USDC: USDC_SOLANA } = SOLANA_CHAIN_INFO.tokens

export const { USDT } = MAINNET_CHAIN_INFO.tokens

export const { USDC: USDC_MAINNET } = MAINNET_CHAIN_INFO.tokens

export const USDC = USDC_MAINNET

export const { USDC: USDC_OPTIMISM } = OPTIMISM_CHAIN_INFO.tokens

export const { USDT: USDT_OPTIMISM } = OPTIMISM_CHAIN_INFO.tokens

export const { DAI: DAI_OPTIMISM } = OPTIMISM_CHAIN_INFO.tokens

export const WBTC_OPTIMISM = new Token(
  UniverseChainId.Optimism,
  '0x68f180fcCe6836688e9084f035309E29Bf0A2095',
  8,
  'WBTC',
  'Wrapped BTC',
)

export const { USDC: USDC_BASE } = BASE_CHAIN_INFO.tokens

export const BTC_BSC = new Token(UniverseChainId.Bnb, '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', 18, 'BTCB', 'BTCB')

export const { USDC: USDC_BNB } = BNB_CHAIN_INFO.tokens

export const { USDT: USDT_BNB } = BNB_CHAIN_INFO.tokens

export const USDC_BSC = USDC_BNB

export const USDT_BSC = USDT_BNB

export const ETH_BSC = new Token(
  UniverseChainId.Bnb,
  '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
  18,
  'WETH',
  'Ethereum',
)

export const BUSD_BSC = new Token(UniverseChainId.Bnb, '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', 18, 'BUSD', 'BUSD')

export const DAI_BSC = new Token(UniverseChainId.Bnb, '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', 18, 'DAI', 'DAI')

export const { DAI: DAI_POLYGON } = POLYGON_CHAIN_INFO.tokens

export const { USDC: USDC_POLYGON } = POLYGON_CHAIN_INFO.tokens

export const { USDT: USDT_POLYGON } = POLYGON_CHAIN_INFO.tokens

export const WBTC_POLYGON = new Token(
  UniverseChainId.Polygon,
  '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6',
  8,
  'WBTC',
  'Wrapped BTC',
)

export const WETH_POLYGON = new Token(
  UniverseChainId.Polygon,
  '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
  18,
  'WETH',
  'Wrapped Ether',
)

export const { USDB: USDB_BLAST } = BLAST_CHAIN_INFO.tokens

export const ARB = new Token(
  UniverseChainId.ArbitrumOne,
  '0x912CE59144191C1204E64559FE8253a0e49E6548',
  18,
  'ARB',
  'Arbitrum',
)

export const { USDT: USDT_ARBITRUM_ONE } = ARBITRUM_CHAIN_INFO.tokens

export const { USDC: USDC_ARBITRUM } = ARBITRUM_CHAIN_INFO.tokens

export const WBTC_ARBITRUM_ONE = new Token(
  UniverseChainId.ArbitrumOne,
  '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
  8,
  'WBTC',
  'Wrapped BTC',
)

export const { DAI: DAI_ARBITRUM_ONE } = ARBITRUM_CHAIN_INFO.tokens

export const { USDC: USDC_AVALANCHE } = AVALANCHE_CHAIN_INFO.tokens

export const { USDT: USDT_AVALANCHE } = AVALANCHE_CHAIN_INFO.tokens

export const WETH_AVALANCHE = new Token(
  UniverseChainId.Avalanche,
  '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB',
  18,
  'WETH',
  'Wrapped Ether',
)

export const { DAI: DAI_AVALANCHE } = AVALANCHE_CHAIN_INFO.tokens

export const PORTAL_ETH_CELO = new Token(
  UniverseChainId.Celo,
  '0x66803FB87aBd4aaC3cbB3fAd7C3aa01f6F3FB207',
  18,
  'ETH',
  'Portal Ether',
)

export const { USDC: USDC_CELO } = CELO_CHAIN_INFO.tokens

export const { USDC: USDC_ZORA } = ZORA_CHAIN_INFO.tokens

export const { USDC: USDC_WORLD_CHAIN } = WORLD_CHAIN_INFO.tokens

export const { USDC: USDC_ZKSYNC } = ZKSYNC_CHAIN_INFO.tokens

export const WBTC = new Token(
  UniverseChainId.Mainnet,
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
  8,
  'WBTC',
  'Wrapped BTC',
)

export const MATIC_MAINNET = new Token(
  UniverseChainId.Mainnet,
  '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0',
  18,
  'MATIC',
  'Polygon Matic',
)

export const UNI = {
  [UniverseChainId.Mainnet]: new Token(
    UniverseChainId.Mainnet,
    UNI_ADDRESSES[UniverseChainId.Mainnet] as string,
    18,
    'UNI',
    'Uniswap',
  ),
  [UniverseChainId.Optimism]: new Token(
    UniverseChainId.Optimism,
    UNI_ADDRESSES[UniverseChainId.Optimism] as string,
    18,
    'UNI',
    'Uniswap',
  ),
  [UniverseChainId.Sepolia]: new Token(
    UniverseChainId.Sepolia,
    UNI_ADDRESSES[UniverseChainId.Sepolia] as string,
    18,
    'UNI',
    'Uniswap',
  ),
}

export const OP = new Token(
  UniverseChainId.Optimism,
  '0x4200000000000000000000000000000000000042',
  18,
  'OP',
  'Optimism',
)

export const LDO = new Token(
  UniverseChainId.Mainnet,
  '0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32',
  18,
  'LDO',
  'Lido DAO Token',
)
export const NMR = new Token(
  UniverseChainId.Mainnet,
  '0x1776e1F26f98b1A5dF9cD347953a26dd3Cb46671',
  18,
  'NMR',
  'Numeraire',
)
export const MNW = new Token(
  UniverseChainId.Mainnet,
  '0xd3E4Ba569045546D09CF021ECC5dFe42b1d7f6E4',
  18,
  'MNW',
  'Morpheus.Network',
)

export const WRAPPED_NATIVE_CURRENCY: { [chainId: number]: Token | undefined } = {
  ...(WETH9 as Record<UniverseChainId, Token>),
  [UniverseChainId.ArbitrumOne]: new Token(
    UniverseChainId.ArbitrumOne,
    '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    18,
    'WETH',
    'Wrapped Ether',
  ),
  [UniverseChainId.Avalanche]: new Token(
    UniverseChainId.Avalanche,
    '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
    18,
    'WAVAX',
    'Wrapped AVAX',
  ),
  [UniverseChainId.Base]: new Token(
    UniverseChainId.Base,
    '0x4200000000000000000000000000000000000006',
    18,
    'WETH',
    'Wrapped Ether',
  ),
  [UniverseChainId.Blast]: new Token(
    UniverseChainId.Blast,
    '0x4300000000000000000000000000000000000004',
    18,
    'WETH',
    'Wrapped Ether',
  ),
  [UniverseChainId.Bnb]: new Token(
    UniverseChainId.Bnb,
    '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    18,
    'WBNB',
    'Wrapped BNB',
  ),
  [UniverseChainId.Celo]: new Token(
    UniverseChainId.Celo,
    // This is the precompile contract address that makes the native asset fully compliant with ERC20.
    '0x471ece3750da237f93b8e339c536989b8978a438',
    18,
    'CELO',
    'Celo',
  ),
  [UniverseChainId.Monad]: new Token(
    UniverseChainId.Monad,
    '0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A',
    18,
    'WMON',
    'Wrapped Monad',
  ),
  [UniverseChainId.Optimism]: new Token(
    UniverseChainId.Optimism,
    '0x4200000000000000000000000000000000000006',
    18,
    'WETH',
    'Wrapped Ether',
  ),
  [UniverseChainId.Polygon]: new Token(
    UniverseChainId.Polygon,
    '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    18,
    'WMATIC',
    'Wrapped MATIC',
  ),
  [UniverseChainId.Sepolia]: new Token(
    UniverseChainId.Sepolia,
    '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
    18,
    'WETH',
    'Wrapped Ether',
  ),
  [UniverseChainId.Soneium]: new Token(
    UniverseChainId.Soneium,
    '0x4200000000000000000000000000000000000006',
    18,
    'WETH',
    'Wrapped Ether',
  ),
  [UniverseChainId.Unichain]: new Token(
    UniverseChainId.Unichain,
    '0x4200000000000000000000000000000000000006',
    18,
    'WETH',
    'Wrapped Ether',
  ),
  [UniverseChainId.UnichainSepolia]: new Token(
    UniverseChainId.UnichainSepolia,
    '0x4200000000000000000000000000000000000006',
    18,
    'WETH',
    'Wrapped Ether',
  ),
  [UniverseChainId.WorldChain]: new Token(
    UniverseChainId.WorldChain,
    '0x4200000000000000000000000000000000000006',
    18,
    'WETH',
    'Wrapped Ether',
  ),
  [UniverseChainId.Zksync]: new Token(
    UniverseChainId.Zksync,
    '0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91',
    18,
    'WETH',
    'Wrapped Ether',
  ),
  [UniverseChainId.Zora]: new Token(
    UniverseChainId.Zora,
    '0x4200000000000000000000000000000000000006',
    18,
    'WETH',
    'Wrapped Ether',
  ),
  [UniverseChainId.Solana]: new SolanaToken(
    UniverseChainId.Solana,
    WRAPPED_SOL_ADDRESS_SOLANA,
    9,
    'WSOL',
    'Wrapped SOL',
  ),
}

class NativeCurrencyImpl extends NativeCurrency {
  public get wrapped(): Token {
    const wrapped = WRAPPED_NATIVE_CURRENCY[this.chainId]
    if (wrapped) {
      return wrapped
    }
    throw new Error(`Unsupported chain ID: ${this.chainId}`)
  }

  constructor(chainId: number) {
    if (!isUniverseChainId(chainId)) {
      logger.warn('tokens.ts', 'NativeCurrencyImpl', `Initializing native currency for non-universe chain: ${chainId}`)
      super(chainId, 18, 'ETH', 'Ethereum')
      return
    }

    const { name, decimals, symbol } = getChainInfo(chainId).nativeCurrency
    super(chainId, decimals, symbol, name)
  }

  public equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId
  }
}

const cachedNativeCurrency: { [chainId: number]: NativeCurrencyImpl } = {}

/**
 * @deprecated Prefer obtaining metadata via the non-sdk-based getChainInfo(chainId).nativeCurrency instead.
 *
 * Utility for obtaining an `@uniswap/sdk-core` `NativeCurrency` instance for a given chainId.
 */
export function nativeOnChain(chainId: number): NativeCurrencyImpl {
  const cached = cachedNativeCurrency[chainId]

  if (cached) {
    return cached
  }

  const result = new NativeCurrencyImpl(chainId)
  cachedNativeCurrency[chainId] = result
  return result
}

// TODO[DAT-1513]: Replace with metadata fields from backend
export const UNICHAIN_BRIDGED_ASSETS: readonly BridgedAsset[] = [
  {
    unichainAddress: '0xbde8a5331e8ac4831cf8ea9e42e229219eafab97', // SOL
    nativeChain: 'Solana',
    nativeAddress: 'native',
  },
  {
    unichainAddress: '0xbe51A5e8FA434F09663e8fB4CCe79d0B2381Afad', // JUP
    nativeChain: 'Solana',
    nativeAddress: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  },
  {
    unichainAddress: '0x97Fadb3D000b953360FD011e173F12cDDB5d70Fa', // WIF
    nativeChain: 'Solana',
    nativeAddress: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  },
  {
    unichainAddress: '0x15d0e0c55a3e7ee67152ad7e89acf164253ff68d', // HYPE
    nativeChain: 'HyperEVM',
    nativeAddress: 'native',
  },
  {
    unichainAddress: '0xBbE97f3522101e5B6976cBf77376047097BA837F', // BONK
    nativeChain: 'Solana',
    nativeAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  },
]

export function isBridgedAsset(address: string): boolean {
  return UNICHAIN_BRIDGED_ASSETS.some((asset) => asset.unichainAddress === address)
}

export type BridgedAsset = {
  unichainAddress: string
  nativeChain: string
  nativeAddress: string
}

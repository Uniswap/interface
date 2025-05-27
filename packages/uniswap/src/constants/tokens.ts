/* eslint-disable max-lines */
import { Currency, NativeCurrency, Token, UNI_ADDRESSES, WETH9 } from '@uniswap/sdk-core'
import invariant from 'tiny-invariant'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export const USDT_MONAD_TESTNET = new Token(
  UniverseChainId.MonadTestnet,
  '0xfBC2D240A5eD44231AcA3A9e9066bc4b33f01149',
  6,
  'USDT',
  'Tether USD',
)

export const USDC_SEPOLIA = new Token(
  UniverseChainId.Sepolia,
  '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238',
  6,
  'USDC',
  'USD//C',
)

export const USDC_UNICHAIN = new Token(
  UniverseChainId.Unichain,
  '0x078D782b760474a361dDA0AF3839290b0EF57AD6',
  6,
  'USDC',
  'USD//C',
)

export const USDC_UNICHAIN_SEPOLIA = new Token(
  UniverseChainId.UnichainSepolia,
  '0x31d0220469e10c4E71834a79b1f276d740d3768F',
  6,
  'USDC',
  'USD//C',
)

export const USDC_SONEIUM = new Token(
  UniverseChainId.Soneium,
  '0xbA9986D2381edf1DA03B0B9c1f8b00dc4AacC369',
  6,
  'USDCE',
  'Soneium Bridged USDC Soneium',
)

export const DAI = new Token(
  UniverseChainId.Mainnet,
  '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  18,
  'DAI',
  'Dai Stablecoin',
)

export const USDT = new Token(
  UniverseChainId.Mainnet,
  '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  6,
  'USDT',
  'Tether USD',
)

export const USDC_MAINNET = new Token(
  UniverseChainId.Mainnet,
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  6,
  'USDC',
  'USD//C',
)

export const USDC = new Token(
  UniverseChainId.Mainnet,
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  6,
  'USDC',
  'USD//C',
)

export const USDC_OPTIMISM = new Token(
  UniverseChainId.Optimism,
  '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
  6,
  'USDC',
  'USD//C',
)

export const USDT_OPTIMISM = new Token(
  UniverseChainId.Optimism,
  '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
  6,
  'USDT',
  'Tether USD',
)

export const DAI_OPTIMISM = new Token(
  UniverseChainId.Optimism,
  '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
  18,
  'DAI',
  'Dai stable coin',
)

export const WBTC_OPTIMISM = new Token(
  UniverseChainId.Optimism,
  '0x68f180fcCe6836688e9084f035309E29Bf0A2095',
  8,
  'WBTC',
  'Wrapped BTC',
)

export const USDC_BASE = new Token(
  UniverseChainId.Base,
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
  6,
  'USDC',
  'USD Coin',
)

export const BTC_BSC = new Token(UniverseChainId.Bnb, '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', 18, 'BTCB', 'BTCB')

export const USDC_BNB = new Token(UniverseChainId.Bnb, '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', 18, 'USDC', 'USDC')

export const USDT_BNB = new Token(
  UniverseChainId.Bnb,
  '0x55d398326f99059ff775485246999027b3197955',
  18,
  'USDT',
  'TetherUSD',
)

export const USDC_BSC = new Token(UniverseChainId.Bnb, '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', 18, 'USDC', 'USDC')

export const USDT_BSC = new Token(UniverseChainId.Bnb, '0x55d398326f99059fF775485246999027B3197955', 18, 'USDT', 'USDT')

export const ETH_BSC = new Token(
  UniverseChainId.Bnb,
  '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
  18,
  'ETH',
  'Ethereum',
)

export const BUSD_BSC = new Token(UniverseChainId.Bnb, '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', 18, 'BUSD', 'BUSD')

export const DAI_BSC = new Token(UniverseChainId.Bnb, '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', 18, 'DAI', 'DAI')

export const DAI_POLYGON = new Token(
  UniverseChainId.Polygon,
  '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
  18,
  'DAI',
  'Dai Stablecoin',
)

export const USDC_POLYGON = new Token(
  UniverseChainId.Polygon,
  '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
  6,
  'USDC',
  'USD Coin',
)

export const USDT_POLYGON = new Token(
  UniverseChainId.Polygon,
  '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
  6,
  'USDT',
  'Tether USD',
)

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

export const USDB_BLAST = new Token(
  UniverseChainId.Blast,
  '0x4300000000000000000000000000000000000003',
  18,
  'USDB',
  'USDB',
)

export const ARB = new Token(
  UniverseChainId.ArbitrumOne,
  '0x912CE59144191C1204E64559FE8253a0e49E6548',
  18,
  'ARB',
  'Arbitrum',
)

export const USDT_ARBITRUM_ONE = new Token(
  UniverseChainId.ArbitrumOne,
  '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
  6,
  'USDT',
  'Tether USD',
)

export const USDC_ARBITRUM = new Token(
  UniverseChainId.ArbitrumOne,
  '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  6,
  'USDC',
  'USD//C',
)

export const WBTC_ARBITRUM_ONE = new Token(
  UniverseChainId.ArbitrumOne,
  '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
  8,
  'WBTC',
  'Wrapped BTC',
)

export const DAI_ARBITRUM_ONE = new Token(
  UniverseChainId.ArbitrumOne,
  '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
  18,
  'DAI',
  'Dai stable coin',
)

export const USDC_AVALANCHE = new Token(
  UniverseChainId.Avalanche,
  '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
  6,
  'USDC',
  'USDC Token',
)

export const USDT_AVALANCHE = new Token(
  UniverseChainId.Avalanche,
  '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
  6,
  'USDT',
  'Tether USD',
)
export const WETH_AVALANCHE = new Token(
  UniverseChainId.Avalanche,
  '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB',
  18,
  'WETH',
  'Wrapped Ether',
)
export const DAI_AVALANCHE = new Token(
  UniverseChainId.Avalanche,
  '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70',
  18,
  'DAI.e',
  'Dai.e Token',
)

export const CELO_CELO = new Token(
  UniverseChainId.Celo,
  '0x471EcE3750Da237f93B8E339c536989b8978a438',
  18,
  'CELO',
  'Celo',
)

export const PORTAL_ETH_CELO = new Token(
  UniverseChainId.Celo,
  '0x66803FB87aBd4aaC3cbB3fAd7C3aa01f6F3FB207',
  18,
  'ETH',
  'Portal Ether',
)

export const USDC_CELO = new Token(
  UniverseChainId.Celo,
  '0xceba9300f2b948710d2653dd7b07f33a8b32118c',
  6,
  'USDC',
  'USD Coin',
)

export const CUSD_CELO = new Token(
  UniverseChainId.Celo,
  '0x765DE816845861e75A25fCA122bb6898B8B1282a',
  18,
  'cUSD',
  'Celo Dollar',
)

export const USDC_ZORA = new Token(
  UniverseChainId.Zora,
  '0xCccCCccc7021b32EBb4e8C08314bD62F7c653EC4',
  6,
  'USDC',
  'USD Coin',
)

export const USDC_WORLD_CHAIN = new Token(
  UniverseChainId.WorldChain,
  '0x79A02482A880bCE3F13e09Da970dC34db4CD24d1',
  6,
  'USDC.e',
  'Bridged USDC',
)

export const USDC_ZKSYNC = new Token(
  UniverseChainId.Zksync,
  '0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4',
  6,
  'USDC',
  'USDC',
)

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

export const WRAPPED_NATIVE_CURRENCY: { [chainId: number]: Token } = {
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
    '0x471ece3750da237f93b8e339c536989b8978a438',
    18,
    'CELO',
    'Celo native asset',
  ),
  [UniverseChainId.MonadTestnet]: new Token(
    UniverseChainId.MonadTestnet,
    '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701',
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
}

export function isCelo(chainId: number): chainId is UniverseChainId.Celo {
  return chainId === UniverseChainId.Celo
}

// Celo has a precompile for its native asset that is fully-compliant with ERC20 interface
// so we can treat it as an ERC20 token. (i.e. $CELO pools are created with its ERC20 precompile)
function getCeloNativeCurrency(chainId: number): Token {
  switch (chainId) {
    case UniverseChainId.Celo:
      return CELO_CELO
    default:
      throw new Error('Not celo')
  }
}

export function isPolygon(chainId: number): chainId is UniverseChainId.Polygon {
  return chainId === UniverseChainId.Polygon
}

// Polygon also has a precompile, but its precompile is not fully erc20-compatible.
// So we treat Polygon's native asset as NativeCurrency since we can't treat it like an ERC20 token.
class PolygonNativeCurrency extends NativeCurrency {
  equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId
  }

  get wrapped(): Token {
    if (!isPolygon(this.chainId)) {
      throw new Error('Not Polygon')
    }
    const wrapped = WRAPPED_NATIVE_CURRENCY[this.chainId]
    invariant(wrapped instanceof Token)
    return wrapped
  }

  public constructor(chainId: number) {
    if (!isPolygon(chainId)) {
      throw new Error('Not Polygon')
    }
    super(chainId, 18, 'POL', 'Polygon Ecosystem Token')
  }
}

export function isBsc(chainId: number): chainId is UniverseChainId.Bnb {
  return chainId === UniverseChainId.Bnb
}

class BscNativeCurrency extends NativeCurrency {
  equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId
  }

  get wrapped(): Token {
    if (!isBsc(this.chainId)) {
      throw new Error('Not bnb')
    }
    const wrapped = WRAPPED_NATIVE_CURRENCY[this.chainId]
    invariant(wrapped instanceof Token)
    return wrapped
  }

  public constructor(chainId: number) {
    if (!isBsc(chainId)) {
      throw new Error('Not bnb')
    }
    super(chainId, 18, 'BNB', 'BNB')
  }
}

export function isAvalanche(chainId: number): chainId is UniverseChainId.Avalanche {
  return chainId === UniverseChainId.Avalanche
}

class AvaxNativeCurrency extends NativeCurrency {
  equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId
  }

  get wrapped(): Token {
    if (!isAvalanche(this.chainId)) {
      throw new Error('Not avalanche')
    }
    const wrapped = WRAPPED_NATIVE_CURRENCY[this.chainId]
    invariant(wrapped instanceof Token)
    return wrapped
  }

  public constructor(chainId: number) {
    if (!isAvalanche(chainId)) {
      throw new Error('Not avalanche')
    }
    super(chainId, 18, 'AVAX', 'AVAX')
  }
}

function isMonadTestnet(chainId: number): chainId is UniverseChainId.MonadTestnet {
  return chainId === UniverseChainId.MonadTestnet
}

// can reuse for monad mainnet when we add support
class MonadTestnetNativeCurrency extends NativeCurrency {
  equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId
  }

  get wrapped(): Token {
    if (!isMonadTestnet(this.chainId)) {
      throw new Error('Not monad testnet')
    }
    const wrapped = WRAPPED_NATIVE_CURRENCY[this.chainId]
    invariant(wrapped instanceof Token)
    return wrapped
  }

  public constructor(chainId: number) {
    if (!isMonadTestnet(chainId)) {
      throw new Error('Not monad testnet')
    }
    super(chainId, 18, 'MON', 'MON')
  }
}

class ExtendedEther extends NativeCurrency {
  public get wrapped(): Token {
    const wrapped = WRAPPED_NATIVE_CURRENCY[this.chainId]
    if (wrapped) {
      return wrapped
    }
    throw new Error(`Unsupported chain ID: ${this.chainId}`)
  }

  protected constructor(chainId: number) {
    super(chainId, 18, 'ETH', 'Ethereum')
  }

  private static _cachedExtendedEther: { [chainId: number]: NativeCurrency } = {}

  public static onChain(chainId: number): ExtendedEther {
    return this._cachedExtendedEther[chainId] ?? (this._cachedExtendedEther[chainId] = new ExtendedEther(chainId))
  }

  public equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId
  }
}

const cachedNativeCurrency: { [chainId: number]: NativeCurrency | Token } = {}
export function nativeOnChain(chainId: number): NativeCurrency | Token {
  if (cachedNativeCurrency[chainId]) {
    return cachedNativeCurrency[chainId] as NativeCurrency
  }
  let nativeCurrency: NativeCurrency | Token
  if (isPolygon(chainId)) {
    nativeCurrency = new PolygonNativeCurrency(chainId)
  } else if (isCelo(chainId)) {
    nativeCurrency = getCeloNativeCurrency(chainId)
  } else if (isBsc(chainId)) {
    nativeCurrency = new BscNativeCurrency(chainId)
  } else if (isAvalanche(chainId)) {
    nativeCurrency = new AvaxNativeCurrency(chainId)
  } else if (isMonadTestnet(chainId)) {
    nativeCurrency = new MonadTestnetNativeCurrency(chainId)
  } else {
    nativeCurrency = ExtendedEther.onChain(chainId)
  }
  return (cachedNativeCurrency[chainId] = nativeCurrency)
}

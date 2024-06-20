import { ChainId, Currency, Ether, NativeCurrency, Token } from '@ubeswap/sdk-core'

// WIP: Gnosis, Moonbeam
export const SUPPORTED_CHAINS: ChainId[] = [
  ChainId.MAINNET,
  ChainId.OPTIMISM,
  ChainId.OPTIMISM_GOERLI,
  ChainId.ARBITRUM_ONE,
  ChainId.ARBITRUM_GOERLI,
  ChainId.POLYGON,
  ChainId.POLYGON_MUMBAI,
  ChainId.GOERLI,
  ChainId.SEPOLIA,
  ChainId.CELO_ALFAJORES,
  ChainId.CELO,
  ChainId.BNB,
  ChainId.AVALANCHE,
  ChainId.BASE,
  // Gnosis and Moonbeam don't yet have contracts deployed yet
]

export const V2_SUPPORTED = [ChainId.MAINNET, ChainId.GOERLI, ChainId.SEPOLIA, ChainId.CELO, ChainId.CELO_ALFAJORES]

export const HAS_L1_FEE = [
  ChainId.OPTIMISM,
  ChainId.OPTIMISM_GOERLI,
  ChainId.ARBITRUM_ONE,
  ChainId.ARBITRUM_GOERLI,
  ChainId.BASE,
  ChainId.BASE_GOERLI,
]

export const NETWORKS_WITH_SAME_UNISWAP_ADDRESSES = [
  ChainId.MAINNET,
  ChainId.GOERLI,
  ChainId.OPTIMISM,
  ChainId.ARBITRUM_ONE,
  ChainId.POLYGON,
  ChainId.POLYGON_MUMBAI,
]

export const ID_TO_CHAIN_ID = (id: number): ChainId => {
  switch (id) {
    case 1:
      return ChainId.MAINNET
    case 5:
      return ChainId.GOERLI
    case 11155111:
      return ChainId.SEPOLIA
    case 56:
      return ChainId.BNB
    case 10:
      return ChainId.OPTIMISM
    case 420:
      return ChainId.OPTIMISM_GOERLI
    case 42161:
      return ChainId.ARBITRUM_ONE
    case 421613:
      return ChainId.ARBITRUM_GOERLI
    case 137:
      return ChainId.POLYGON
    case 80001:
      return ChainId.POLYGON_MUMBAI
    case 42220:
      return ChainId.CELO
    case 44787:
      return ChainId.CELO_ALFAJORES
    case 100:
      return ChainId.GNOSIS
    case 1284:
      return ChainId.MOONBEAM
    case 43114:
      return ChainId.AVALANCHE
    case 8453:
      return ChainId.BASE
    case 84531:
      return ChainId.BASE_GOERLI
    default:
      throw new Error(`Unknown chain id: ${id}`)
  }
}

export enum ChainName {
  MAINNET = 'mainnet',
  GOERLI = 'goerli',
  SEPOLIA = 'sepolia',
  OPTIMISM = 'optimism-mainnet',
  OPTIMISM_GOERLI = 'optimism-goerli',
  ARBITRUM_ONE = 'arbitrum-mainnet',
  ARBITRUM_GOERLI = 'arbitrum-goerli',
  POLYGON = 'polygon-mainnet',
  POLYGON_MUMBAI = 'polygon-mumbai',
  CELO = 'celo-mainnet',
  CELO_ALFAJORES = 'celo-alfajores',
  GNOSIS = 'gnosis-mainnet',
  MOONBEAM = 'moonbeam-mainnet',
  BNB = 'bnb-mainnet',
  AVALANCHE = 'avalanche-mainnet',
  BASE = 'base-mainnet',
  BASE_GOERLI = 'base-goerli',
}

export enum NativeCurrencyName {
  // Strings match input for CLI
  ETHER = 'ETH',
  MATIC = 'MATIC',
  CELO = 'CELO',
  GNOSIS = 'XDAI',
  MOONBEAM = 'GLMR',
  BNB = 'BNB',
  AVALANCHE = 'AVAX',
}

export const NATIVE_NAMES_BY_ID: { [chainId: number]: string[] } = {
  [ChainId.MAINNET]: ['ETH', 'ETHER', '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'],
  [ChainId.GOERLI]: ['ETH', 'ETHER', '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'],
  [ChainId.SEPOLIA]: ['ETH', 'ETHER', '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'],
  [ChainId.OPTIMISM]: ['ETH', 'ETHER', '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'],
  [ChainId.OPTIMISM_GOERLI]: ['ETH', 'ETHER', '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'],
  [ChainId.ARBITRUM_ONE]: ['ETH', 'ETHER', '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'],
  [ChainId.ARBITRUM_GOERLI]: ['ETH', 'ETHER', '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'],
  [ChainId.POLYGON]: ['MATIC', '0x0000000000000000000000000000000000001010'],
  [ChainId.POLYGON_MUMBAI]: ['MATIC', '0x0000000000000000000000000000000000001010'],
  [ChainId.CELO]: ['CELO'],
  [ChainId.CELO_ALFAJORES]: ['CELO'],
  [ChainId.GNOSIS]: ['XDAI'],
  [ChainId.MOONBEAM]: ['GLMR'],
  [ChainId.BNB]: ['BNB', 'BNB', '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'],
  [ChainId.AVALANCHE]: ['AVAX', 'AVALANCHE', '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'],
  [ChainId.BASE]: ['ETH', 'ETHER', '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'],
}

export const NATIVE_CURRENCY: { [chainId: number]: NativeCurrencyName } = {
  [ChainId.MAINNET]: NativeCurrencyName.ETHER,
  [ChainId.GOERLI]: NativeCurrencyName.ETHER,
  [ChainId.SEPOLIA]: NativeCurrencyName.ETHER,
  [ChainId.OPTIMISM]: NativeCurrencyName.ETHER,
  [ChainId.OPTIMISM_GOERLI]: NativeCurrencyName.ETHER,
  [ChainId.ARBITRUM_ONE]: NativeCurrencyName.ETHER,
  [ChainId.ARBITRUM_GOERLI]: NativeCurrencyName.ETHER,
  [ChainId.POLYGON]: NativeCurrencyName.MATIC,
  [ChainId.POLYGON_MUMBAI]: NativeCurrencyName.MATIC,
  [ChainId.CELO]: NativeCurrencyName.CELO,
  [ChainId.CELO_ALFAJORES]: NativeCurrencyName.CELO,
  [ChainId.GNOSIS]: NativeCurrencyName.GNOSIS,
  [ChainId.MOONBEAM]: NativeCurrencyName.MOONBEAM,
  [ChainId.BNB]: NativeCurrencyName.BNB,
  [ChainId.AVALANCHE]: NativeCurrencyName.AVALANCHE,
  [ChainId.BASE]: NativeCurrencyName.ETHER,
}

export const ID_TO_NETWORK_NAME = (id: number): ChainName => {
  switch (id) {
    case 1:
      return ChainName.MAINNET
    case 5:
      return ChainName.GOERLI
    case 11155111:
      return ChainName.SEPOLIA
    case 56:
      return ChainName.BNB
    case 10:
      return ChainName.OPTIMISM
    case 420:
      return ChainName.OPTIMISM_GOERLI
    case 42161:
      return ChainName.ARBITRUM_ONE
    case 421613:
      return ChainName.ARBITRUM_GOERLI
    case 137:
      return ChainName.POLYGON
    case 80001:
      return ChainName.POLYGON_MUMBAI
    case 42220:
      return ChainName.CELO
    case 44787:
      return ChainName.CELO_ALFAJORES
    case 100:
      return ChainName.GNOSIS
    case 1284:
      return ChainName.MOONBEAM
    case 43114:
      return ChainName.AVALANCHE
    case 8453:
      return ChainName.BASE
    case 84531:
      return ChainName.BASE_GOERLI
    default:
      throw new Error(`Unknown chain id: ${id}`)
  }
}

export const CHAIN_IDS_LIST = Object.values(ChainId).map((c) => c.toString()) as string[]

export const ID_TO_PROVIDER = (id: ChainId): string => {
  switch (id) {
    case ChainId.MAINNET:
      return process.env.JSON_RPC_PROVIDER!
    case ChainId.GOERLI:
      return process.env.JSON_RPC_PROVIDER_GORLI!
    case ChainId.SEPOLIA:
      return process.env.JSON_RPC_PROVIDER_SEPOLIA!
    case ChainId.OPTIMISM:
      return process.env.JSON_RPC_PROVIDER_OPTIMISM!
    case ChainId.OPTIMISM_GOERLI:
      return process.env.JSON_RPC_PROVIDER_OPTIMISM_GOERLI!
    case ChainId.ARBITRUM_ONE:
      return process.env.JSON_RPC_PROVIDER_ARBITRUM_ONE!
    case ChainId.ARBITRUM_GOERLI:
      return process.env.JSON_RPC_PROVIDER_ARBITRUM_GOERLI!
    case ChainId.POLYGON:
      return process.env.JSON_RPC_PROVIDER_POLYGON!
    case ChainId.POLYGON_MUMBAI:
      return process.env.JSON_RPC_PROVIDER_POLYGON_MUMBAI!
    case ChainId.CELO:
      return process.env.JSON_RPC_PROVIDER_CELO!
    case ChainId.CELO_ALFAJORES:
      return process.env.JSON_RPC_PROVIDER_CELO_ALFAJORES!
    case ChainId.BNB:
      return process.env.JSON_RPC_PROVIDER_BNB!
    case ChainId.AVALANCHE:
      return process.env.JSON_RPC_PROVIDER_AVALANCHE!
    case ChainId.BASE:
      return process.env.JSON_RPC_PROVIDER_BASE!
    default:
      throw new Error(`Chain id: ${id} not supported`)
  }
}

const WETH = new Token(1, '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 18, 'WETH', 'Wrapped Ether')
export const WRAPPED_NATIVE_CURRENCY: { [chainId in ChainId]: Token } = {
  [ChainId.MAINNET]: WETH,
  [ChainId.GOERLI]: WETH,
  [ChainId.SEPOLIA]: WETH,
  [ChainId.BNB]: WETH,
  [ChainId.OPTIMISM]: WETH,
  [ChainId.OPTIMISM_GOERLI]: WETH,
  [ChainId.ARBITRUM_ONE]: WETH,
  [ChainId.ARBITRUM_GOERLI]: WETH,
  [ChainId.POLYGON]: WETH,
  [ChainId.POLYGON_MUMBAI]: WETH,
  [ChainId.GNOSIS]: WETH,
  [ChainId.MOONBEAM]: WETH,
  [ChainId.AVALANCHE]: WETH,
  [ChainId.BASE]: WETH,
  [ChainId.BASE_GOERLI]: WETH,
  [ChainId.ARBITRUM_SEPOLIA]: WETH,
  [ChainId.ZORA_SEPOLIA]: WETH,
  [ChainId.ZORA]: WETH,
  [ChainId.OPTIMISM_SEPOLIA]: WETH,
  [ChainId.ROOTSTOCK]: WETH,
  [ChainId.BLAST]: WETH,

  // The Celo native currency 'CELO' implements the erc-20 token standard
  [ChainId.CELO]: new Token(
    ChainId.CELO,
    '0x471EcE3750Da237f93B8E339c536989b8978a438',
    18,
    'CELO',
    'Celo native asset'
  ),
  [ChainId.CELO_ALFAJORES]: new Token(
    ChainId.CELO_ALFAJORES,
    '0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9',
    18,
    'CELO',
    'Celo native asset'
  ),
}

function isCelo(chainId: number): chainId is ChainId.CELO | ChainId.CELO_ALFAJORES {
  return chainId === ChainId.CELO_ALFAJORES || chainId === ChainId.CELO
}

class CeloNativeCurrency extends NativeCurrency {
  equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId
  }

  get wrapped(): Token {
    if (!isCelo(this.chainId)) throw new Error('Not celo')
    const nativeCurrency = WRAPPED_NATIVE_CURRENCY[this.chainId]
    if (nativeCurrency) {
      return nativeCurrency
    }
    throw new Error(`Does not support this chain ${this.chainId}`)
  }

  public constructor(chainId: number) {
    if (!isCelo(chainId)) throw new Error('Not celo')
    super(chainId, 18, 'CELO', 'Celo')
  }
}

export class ExtendedEther extends Ether {
  public get wrapped(): Token {
    if (this.chainId in WRAPPED_NATIVE_CURRENCY) {
      return WRAPPED_NATIVE_CURRENCY[this.chainId as ChainId.MAINNET | ChainId.CELO | ChainId.CELO_ALFAJORES]
    }
    throw new Error('Unsupported chain ID')
  }

  private static _cachedExtendedEther: { [chainId: number]: NativeCurrency } = {}

  public static onChain(chainId: number): ExtendedEther {
    return this._cachedExtendedEther[chainId] ?? (this._cachedExtendedEther[chainId] = new ExtendedEther(chainId))
  }
}

const cachedNativeCurrency: { [chainId: number]: NativeCurrency } = {}

export function nativeOnChain(chainId: number): NativeCurrency {
  if (cachedNativeCurrency[chainId] != undefined) {
    return cachedNativeCurrency[chainId]!
  }
  if (isCelo(chainId)) {
    cachedNativeCurrency[chainId] = new CeloNativeCurrency(chainId)
  } else {
    cachedNativeCurrency[chainId] = ExtendedEther.onChain(chainId)
  }

  return cachedNativeCurrency[chainId]!
}

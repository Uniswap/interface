import { Token, UNI_ADDRESSES } from '@uniswap/sdk-core'
import { UniverseChainId } from 'uniswap/src/types/chains'

export const USDC_MAINNET = new Token(
  UniverseChainId.Mainnet,
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  6,
  'USDC',
  'USD//C',
)

export const USDC_GOERLI = new Token(
  UniverseChainId.Goerli,
  '0x07865c6e87b9f70255377e024ace6630c1eaa37f',
  6,
  'USDC',
  'USD//C',
)
export const USDC_SEPOLIA = new Token(
  UniverseChainId.Sepolia,
  '0x6f14C02Fc1F78322cFd7d707aB90f18baD3B54f5',
  6,
  'USDC',
  'USD//C',
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

export const DAI_OPTIMISM = new Token(
  UniverseChainId.Optimism,
  '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
  18,
  'DAI',
  'Dai stable coin',
)
export const USDC_OPTIMISM = new Token(
  UniverseChainId.Optimism,
  '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
  6,
  'USDC',
  'USD//C',
)
export const USDC_OPTIMISM_GOERLI = new Token(
  UniverseChainId.OptimismGoerli,
  '0xe05606174bac4A6364B31bd0eCA4bf4dD368f8C6',
  6,
  'USDC',
  'USD//C',
)

export const USDC_BASE = new Token(
  UniverseChainId.Base,
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
  6,
  'USDC',
  'USD Coin',
)

export const USDC_BSC = new Token(UniverseChainId.Bnb, '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', 18, 'USDC', 'USDC')
export const USDT_BSC = new Token(UniverseChainId.Bnb, '0x55d398326f99059fF775485246999027B3197955', 18, 'USDT', 'USDT')

export const MATIC_POLYGON = new Token(
  UniverseChainId.Polygon,
  '0x0000000000000000000000000000000000001010',
  18,
  'MATIC',
  'Matic',
)
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
export const USDC_POLYGON_MUMBAI = new Token(
  UniverseChainId.PolygonMumbai,
  '0x0fa8781a83e46826621b3bc094ea2a0212e71b23',
  6,
  'USDC',
  'USD Coin',
)

export const USDB_BLAST = new Token(
  UniverseChainId.Blast,
  '0x4300000000000000000000000000000000000003',
  18,
  'USDB',
  'USDB',
)

export const USDC_ARBITRUM = new Token(
  UniverseChainId.ArbitrumOne,
  '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  6,
  'USDC',
  'USD//C',
)
export const DAI_ARBITRUM_ONE = new Token(
  UniverseChainId.ArbitrumOne,
  '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
  18,
  'DAI',
  'Dai stable coin',
)
export const USDC_ARBITRUM_GOERLI = new Token(
  UniverseChainId.ArbitrumGoerli,
  '0x8FB1E3fC51F3b789dED7557E680551d93Ea9d892',
  6,
  'USDC',
  'USD//C',
)

export const USDC_AVALANCHE = new Token(
  UniverseChainId.Avalanche,
  '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
  6,
  'USDC',
  'USDC Token',
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
export const CUSD_CELO_ALFAJORES = new Token(
  UniverseChainId.CeloAlfajores,
  '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
  18,
  'CUSD',
  'Celo Dollar',
)

export const USDC_ZORA = new Token(
  UniverseChainId.Zora,
  '0xCccCCccc7021b32EBb4e8C08314bD62F7c653EC4',
  6,
  'USDC',
  'USD Coin',
)

export const USDC = new Token(
  UniverseChainId.Mainnet,
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  6,
  'USDC',
  'USD//C',
)

export const USDBC_BASE = new Token(
  UniverseChainId.Base,
  '0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca',
  6,
  'USDbC',
  'USD Base Coin',
)
export const USDT_BNB = new Token(
  UniverseChainId.Bnb,
  '0x55d398326f99059ff775485246999027b3197955',
  18,
  'USDT',
  'TetherUSD',
)

export const USDB = new Token(UniverseChainId.Blast, '0x4300000000000000000000000000000000000003', 18, 'USDB', 'USDB')

export const CUSD = new Token(UniverseChainId.Celo, '0x765de816845861e75a25fca122bb6898b8b1282a', 18, 'CUSD', 'CUSD')

export const USDzC = new Token(
  UniverseChainId.Zora,
  '0xCccCCccc7021b32EBb4e8C08314bD62F7c653EC4',
  6,
  'USDzC',
  'USD Coin',
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

export const UNI = {
  [UniverseChainId.Mainnet]: new Token(
    UniverseChainId.Mainnet,
    UNI_ADDRESSES[UniverseChainId.Mainnet] as string,
    18,
    'UNI',
    'Uniswap',
  ),
  [UniverseChainId.Goerli]: new Token(
    UniverseChainId.Goerli,
    UNI_ADDRESSES[UniverseChainId.Goerli] as string,
    18,
    'UNI',
    'Uniswap',
  ),
}

import React, { ReactNode } from 'react'
import { AbstractConnector } from '@web3-react/abstract-connector'
import {
  ChainId,
  JSBI,
  Percent,
  CurrencyAmount,
  WETH,
  DXD,
  WXDAI,
  Token,
  Currency,
  RoutablePlatform,
  SWPR
} from '@swapr/sdk'
import { authereum, INFURA_PROJECT_ID, injected, walletConnect } from '../connectors'
import UniswapLogo from '../assets/svg/uniswap-logo.svg'
import SwaprLogo from '../assets/svg/logo.svg'
import SushiswapLogo from '../assets/svg/sushiswap-logo.svg'
import HoneyswapLogo from '../assets/svg/honeyswap-logo.svg'
import BaoswapLogo from '../assets/images/baoswap-logo.png'
import LevinswapLogo from '../assets/images/levinswap-logo.svg'
import { providers } from 'ethers'

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

// a list of tokens by chain
type ChainTokenList = {
  readonly [chainId in ChainId]: Token[]
}

export const DAI = new Token(ChainId.MAINNET, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18, 'DAI', 'Dai Stablecoin')

export const USDC: { [key: number]: Token } = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC', 'USD//C'),
  [ChainId.ARBITRUM_ONE]: new Token(
    ChainId.ARBITRUM_ONE,
    '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
    6,
    'USDC',
    'USD//C'
  ),
  [ChainId.XDAI]: new Token(
    ChainId.XDAI,
    '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83',
    6,
    'USDC',
    'USD//C from Ethereum'
  )
}

export const USDT: { [key: number]: Token } = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6, 'USDT', 'Tether USD'),
  [ChainId.XDAI]: new Token(
    ChainId.XDAI,
    '0x4ECaBa5870353805a9F068101A40E0f32ed605C6',
    6,
    'USDT',
    'Tether USD from Ethereum'
  )
}

export const WBTC: { [key: number]: Token } = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', 8, 'WBTC', 'Wrapped BTC'),
  [ChainId.ARBITRUM_ONE]: new Token(
    ChainId.ARBITRUM_ONE,
    '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
    8,
    'WBTC',
    'Wrapped BTC'
  ),
  [ChainId.XDAI]: new Token(
    ChainId.XDAI,
    '0x8e5bBbb09Ed1ebdE8674Cda39A0c169401db4252',
    8,
    'WBTC',
    'Wrapped BTC from Ethereum'
  )
}

export const HONEY = new Token(ChainId.XDAI, '0x71850b7e9ee3f13ab46d67167341e4bdc905eef9', 18, 'HNY', 'Honey')

export const STAKE = new Token(
  ChainId.XDAI,
  '0xb7D311E2Eb55F2f68a9440da38e7989210b9A05e',
  18,
  'STAKE',
  'Stake Token on xDai'
)

export const BAO = new Token(
  ChainId.XDAI,
  '0x82dFe19164729949fD66Da1a37BC70dD6c4746ce',
  18,
  'BAO',
  'BaoToken from Ethereum'
)

export const AGAVE = new Token(ChainId.XDAI, '0x3a97704a1b25F08aa230ae53B352e2e72ef52843', 18, 'AGVE', 'Agave token')

// used to construct intermediary pairs for trading
export const BASES_TO_CHECK_TRADES_AGAINST: ChainTokenList = {
  [ChainId.MAINNET]: [
    WETH[ChainId.MAINNET],
    DXD[ChainId.MAINNET],
    DAI,
    USDC[ChainId.MAINNET],
    WBTC[ChainId.MAINNET],
    USDT[ChainId.MAINNET]
  ],
  [ChainId.RINKEBY]: [WETH[ChainId.RINKEBY]],
  [ChainId.ARBITRUM_ONE]: [
    WETH[ChainId.ARBITRUM_ONE],
    DXD[ChainId.ARBITRUM_ONE],
    USDC[ChainId.ARBITRUM_ONE],
    WBTC[ChainId.ARBITRUM_ONE]
  ],
  [ChainId.ARBITRUM_RINKEBY]: [WETH[ChainId.ARBITRUM_RINKEBY], DXD[ChainId.ARBITRUM_RINKEBY]],
  [ChainId.XDAI]: [
    WXDAI[ChainId.XDAI],
    WETH[ChainId.XDAI],
    DXD[ChainId.XDAI],
    USDC[ChainId.XDAI],
    USDT[ChainId.XDAI],
    WBTC[ChainId.XDAI],
    HONEY,
    STAKE,
    AGAVE,
    BAO
  ]
}

// used for display in the default list when adding liquidity (native currency is already shown
// by default, so no need to add the wrapper to the list)
export const SUGGESTED_BASES: ChainTokenList = {
  [ChainId.MAINNET]: [
    DXD[ChainId.MAINNET],
    DAI,
    USDC[ChainId.MAINNET],
    USDT[ChainId.MAINNET],
    WBTC[ChainId.MAINNET],
    SWPR[ChainId.MAINNET]
  ],
  [ChainId.RINKEBY]: [],
  [ChainId.ARBITRUM_ONE]: [
    WETH[ChainId.ARBITRUM_ONE],
    DXD[ChainId.ARBITRUM_ONE],
    SWPR[ChainId.ARBITRUM_ONE],
    WBTC[ChainId.ARBITRUM_ONE],
    USDC[ChainId.ARBITRUM_ONE]
  ],
  [ChainId.ARBITRUM_RINKEBY]: [WETH[ChainId.ARBITRUM_RINKEBY], DXD[ChainId.ARBITRUM_RINKEBY]],
  [ChainId.XDAI]: [DXD[ChainId.XDAI], WETH[ChainId.XDAI], USDC[ChainId.XDAI]]
}

// used to construct the list of all pairs we consider by default in the frontend
export const BASES_TO_TRACK_LIQUIDITY_FOR: ChainTokenList = {
  [ChainId.MAINNET]: [WETH[ChainId.MAINNET], DXD[ChainId.MAINNET], DAI, USDC[ChainId.MAINNET], USDT[ChainId.MAINNET]],
  [ChainId.RINKEBY]: [WETH[ChainId.RINKEBY]],
  [ChainId.ARBITRUM_ONE]: [WETH[ChainId.ARBITRUM_ONE], DXD[ChainId.ARBITRUM_ONE], USDC[ChainId.ARBITRUM_ONE]],
  [ChainId.ARBITRUM_RINKEBY]: [WETH[ChainId.ARBITRUM_RINKEBY], DXD[ChainId.ARBITRUM_RINKEBY]],
  [ChainId.XDAI]: [WXDAI[ChainId.XDAI], DXD[ChainId.XDAI], WETH[ChainId.XDAI], USDC[ChainId.XDAI], STAKE]
}

export const PINNED_PAIRS: { readonly [chainId in ChainId]?: [Token, Token][] } = {
  [ChainId.MAINNET]: [
    [USDC[ChainId.MAINNET], USDT[ChainId.MAINNET]],
    [DAI, USDT[ChainId.MAINNET]]
  ]
}

export const ARBITRUM_ONE_PROVIDER = new providers.JsonRpcProvider('https://arb1.arbitrum.io/rpc')
export const ARBITRUM_RINKEBY_PROVIDER = new providers.JsonRpcProvider(
  'https://arb-rinkeby.g.alchemy.com/v2/txw7G1AJxyQ9zvF1NPiLu5hUOwp8_JmK'
)
export const RINKEBY_PROVIDER = new providers.JsonRpcProvider(`https://rinkeby.infura.io/v3/${INFURA_PROJECT_ID}`)

export interface WalletInfo {
  connector?: AbstractConnector
  name: string
  iconName: string
  description: string
  href: string | null
  color: string
  primary?: true
  mobile?: true
  mobileOnly?: true
}

export const SUPPORTED_WALLETS: { [key: string]: WalletInfo } = {
  INJECTED: {
    connector: injected,
    name: 'Injected',
    iconName: 'arrow-right.svg',
    description: 'Injected web3 provider.',
    href: null,
    color: '#010101',
    primary: true
  },
  METAMASK: {
    connector: injected,
    name: 'MetaMask',
    iconName: 'metamask.png',
    description: 'Easy-to-use browser extension.',
    href: null,
    color: '#E8831D',
    mobile: true
  },
  WALLET_CONNECT: {
    connector: walletConnect,
    name: 'WalletConnect',
    iconName: 'wallet-connect.svg',
    description: 'Connect to Trust Wallet, Rainbow Wallet and more...',
    href: null,
    color: '#4196FC',
    mobile: true
  },
  AUTHEREUM: {
    connector: authereum,
    name: 'Authereum',
    iconName: 'authereum.svg',
    description: 'Connect using Authereum.',
    href: null,
    color: '#4196FC',
    mobile: true
  }
}

export const NetworkContextName = 'NETWORK'

// default allowed slippage, in bips
export const INITIAL_ALLOWED_SLIPPAGE = 50
// 20 minutes, denominated in seconds
export const DEFAULT_DEADLINE_FROM_NOW = 60 * 20
export const DEFAULT_USER_MULTIHOP_ENABLED = true

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

export const DEFAULT_TOKEN_LIST = 'ipfs://QmYuv9sUoYk2QquQuWZW3JqCiZC4F5HR9tMgYgF7x5nKs5'

export const ZERO_USD = CurrencyAmount.usd('0')

export interface NetworkDetails {
  chainId: string
  chainName: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  rpcUrls: string[]
  blockExplorerUrls?: string[]
  iconUrls?: string[] // Currently ignored.
}

export const NETWORK_DETAIL: { [chainId: number]: NetworkDetails } = {
  [ChainId.MAINNET]: {
    chainId: `0x${ChainId.MAINNET.toString(16)}`,
    chainName: 'Ethereum mainnet',
    nativeCurrency: {
      name: Currency.ETHER.name || 'Ether',
      symbol: Currency.ETHER.symbol || 'ETH',
      decimals: Currency.ETHER.decimals || 18
    },
    rpcUrls: ['https://mainnet.infura.io/v3'],
    blockExplorerUrls: ['https://etherscan.io']
  },
  [ChainId.XDAI]: {
    chainId: `0x${ChainId.XDAI.toString(16)}`,
    chainName: 'xDAI',
    nativeCurrency: {
      name: Currency.XDAI.name || 'xDAI',
      symbol: Currency.XDAI.symbol || 'xDAI',
      decimals: Currency.XDAI.decimals || 18
    },
    rpcUrls: ['https://rpc.xdaichain.com'],
    blockExplorerUrls: ['https://blockscout.com/xdai/mainnet']
  },
  [ChainId.ARBITRUM_ONE]: {
    chainId: `0x${ChainId.ARBITRUM_ONE.toString(16)}`,
    chainName: 'Arbitrum one',
    nativeCurrency: {
      name: Currency.ETHER.name || 'Ether',
      symbol: Currency.ETHER.symbol || 'ETH',
      decimals: Currency.ETHER.decimals || 18
    },
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://explorer.arbitrum.io']
  },
  [ChainId.ARBITRUM_RINKEBY]: {
    chainId: `0x${ChainId.ARBITRUM_RINKEBY.toString(16)}`,
    chainName: 'Arbitrum Rinkeby',
    nativeCurrency: {
      name: Currency.ETHER.name || 'Ether',
      symbol: Currency.ETHER.symbol || 'ETH',
      decimals: Currency.ETHER.decimals || 18
    },
    rpcUrls: ['https://rinkeby.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://rinkeby-explorer.arbitrum.io']
  }
}

export const ROUTABLE_PLATFORM_LOGO: { [routablePaltformName: string]: ReactNode } = {
  [RoutablePlatform.UNISWAP.name]: <img width={16} height={16} src={UniswapLogo} alt="uniswap" />,
  [RoutablePlatform.SUSHISWAP.name]: <img width={16} height={16} src={SushiswapLogo} alt="sushiswap" />,
  [RoutablePlatform.SWAPR.name]: <img width={16} height={16} src={SwaprLogo} alt="swapr" />,
  [RoutablePlatform.HONEYSWAP.name]: <img width={16} height={16} src={HoneyswapLogo} alt="honeyswap" />,
  [RoutablePlatform.BAOSWAP.name]: <img width={16} height={16} src={BaoswapLogo} alt="baoswap" />,
  [RoutablePlatform.LEVINSWAP.name]: <img width={16} height={16} src={LevinswapLogo} alt="levinswap" />
}

export const OLD_SWPR: { [key: number]: Token } = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, '0xe54942077Df7b8EEf8D4e6bCe2f7B58B0082b0cd', 18, 'SWPR', 'Swapr'),
  [ChainId.ARBITRUM_ONE]: new Token(
    ChainId.ARBITRUM_ONE,
    '0x955b9fe60a5b5093df9Dc4B1B18ec8e934e77162',
    18,
    'SWPR',
    'Swapr'
  ),
  [ChainId.RINKEBY]: new Token(ChainId.RINKEBY, '0xA271cCbC126a41f04BAe8fdBDbCEfCF10Bf59a48', 18, 'SWPR', 'Swapr'),
  [ChainId.ARBITRUM_RINKEBY]: new Token(
    ChainId.ARBITRUM_RINKEBY,
    '0xFe45504a21EA46C194000403B43f6DDBA2DCcC80',
    18,
    'SWPR',
    'Swapr'
  )
}

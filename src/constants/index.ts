import { ChainId, JSBI, Percent, Token, WETH } from '@fuseio/fuse-swap-sdk'
import { AbstractConnector } from '@web3-react/abstract-connector'

import { injected, walletlink } from '../connectors'
import { unwrapOrThrow } from '../utils'

export const ROUTER_ADDRESS = '0xFB76e9E7d88E308aB530330eD90e84a952570319'

export const FUSE_ERC20_TO_ERC677_BRIDGE_HOME_ADDRESS = unwrapOrThrow('FUSE_ERC20_TO_ERC677_BRIDGE_HOME_ADDRESS')
export const FUSE_ERC20_TO_ERC677_BRIDGE_FOREIGN_ADDRESS = unwrapOrThrow('FUSE_ERC20_TO_ERC677_BRIDGE_FOREIGN_ADDRESS')

export const FUSE_ERC677_TO_ERC677_BRIDGE_HOME_ADDRESS = unwrapOrThrow('FUSE_ERC677_TO_ERC677_BRIDGE_HOME_ADDRESS')
export const FUSE_ERC677_TO_ERC677_BRIDGE_FOREIGN_ADDRESS = unwrapOrThrow(
  'FUSE_ERC677_TO_ERC677_BRIDGE_FOREIGN_ADDRESS'
)

export const FUSE_NATIVE_TO_ERC677_BRIDGE_HOME_ADDRESS = unwrapOrThrow('FUSE_NATIVE_TO_ERC677_BRIDGE_HOME_ADDRESS')
export const FUSE_NATIVE_TO_ERC677_BRIDGE_FOREIGN_ADDRESS = unwrapOrThrow(
  'FUSE_NATIVE_TO_ERC677_BRIDGE_FOREIGN_ADDRESS'
)

export const BINANCE_CHAIN_ID = parseInt(unwrapOrThrow('BINANCE_CHAIN_ID'))
export const BINANCE_ERC20_TO_ERC677_FOREIGN_BRIDGE_ADDRESS = unwrapOrThrow(
  'BINANCE_ERC20_TO_ERC677_FOREIGN_BRIDGE_ADDRESS'
)
export const BINANCE_ERC20_TO_ERC677_HOME_BRIDGE_ADDRESS = unwrapOrThrow('BINANCE_ERC20_TO_ERC677_HOME_BRIDGE_ADDRESS')

export const GOODDOLLAR_FOREIGN_TOKEN_ADDRESS = unwrapOrThrow('GOODDOLLAR_FOREIGN_TOKEN_ADDRESS')
export const GOODDOLLAR_HOME_TOKEN_ADDRESS = unwrapOrThrow('GOODDOLLAR_HOME_TOKEN_ADDRESS')

export const FUSE_FOREIGN_TOKEN_ADDRESS = unwrapOrThrow('FUSE_FOREIGN_TOKEN_ADDRESS')

export const TOKEN_MIGRATOR_ADDRESS = unwrapOrThrow('TOKEN_MIGRATOR_ADDRESS')

export const BINANCE_TESTNET_CHAINID = 97
export const BINANCE_MAINNET_CHAINID = 56

// a list of tokens by chain
type ChainTokenList = {
  readonly [chainId in ChainId]: Token[]
}

export const DAI = new Token(ChainId.MAINNET, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18, 'DAI', 'Dai Stablecoin')
export const USDC = new Token(ChainId.MAINNET, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC', 'USD//C')
export const USDT = new Token(ChainId.MAINNET, '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6, 'USDT', 'Tether USD')
export const COMP = new Token(ChainId.MAINNET, '0xc00e94Cb662C3520282E6f5717214004A7f26888', 18, 'COMP', 'Compound')
export const MKR = new Token(ChainId.MAINNET, '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2', 18, 'MKR', 'Maker')
export const AMPL = new Token(ChainId.MAINNET, '0xD46bA6D942050d489DBd938a2C909A5d5039A161', 9, 'AMPL', 'Ampleforth')

export const FUSE_DAI = new Token(
  ChainId.FUSE,
  '0x94Ba7A27c7A95863d1bdC7645AC2951E0cca06bA',
  18,
  'DAI',
  'Dai Stablecoin on Fuse'
)
export const FUSE_USDC = new Token(
  ChainId.FUSE,
  '0x620fd5fa44BE6af63715Ef4E65DDFA0387aD13F5',
  6,
  'USDC',
  'USD Coin on Fuse'
)
export const FUSE_USDT = new Token(
  ChainId.FUSE,
  '0xFaDbBF8Ce7D5b7041bE672561bbA99f79c532e10',
  6,
  'USDT',
  'Tether USD on Fuse'
)
export const FUSE_WBTC = new Token(
  ChainId.FUSE,
  '0x33284f95ccb7B948d9D352e1439561CF83d8d00d',
  8,
  'WBTC',
  'Wrapped BTC on Fuse'
)
export const FUSE_WETH = new Token(
  ChainId.FUSE,
  '0xd8Bf72f3e163B9CF0C73dFdCC316417A5ac20670',
  18,
  'WETH',
  'Wrapped Ether on Fuse'
)

const WETH_ONLY: ChainTokenList = {
  [ChainId.MAINNET]: [WETH[ChainId.MAINNET]],
  [ChainId.ROPSTEN]: [WETH[ChainId.ROPSTEN]],
  [ChainId.RINKEBY]: [WETH[ChainId.RINKEBY]],
  [ChainId.GÖRLI]: [WETH[ChainId.GÖRLI]],
  [ChainId.KOVAN]: [WETH[ChainId.KOVAN]],
  [ChainId.FUSE]: [WETH[ChainId.FUSE]]
}

// used to construct intermediary pairs for trading
export const BASES_TO_CHECK_TRADES_AGAINST: ChainTokenList = {
  ...WETH_ONLY,
  [ChainId.MAINNET]: [...WETH_ONLY[ChainId.MAINNET], DAI, USDC, USDT, COMP, MKR],
  [ChainId.FUSE]: [...WETH_ONLY[ChainId.FUSE], FUSE_DAI, FUSE_USDC, FUSE_USDT, FUSE_WBTC, FUSE_WETH]
}

/**
 * Some tokens can only be swapped via certain pairs, so we override the list of bases that are considered for these
 * tokens.
 */
export const CUSTOM_BASES: { [chainId in ChainId]?: { [tokenAddress: string]: Token[] } } = {
  [ChainId.MAINNET]: {
    [AMPL.address]: [DAI, WETH[ChainId.MAINNET]]
  }
}

// used for display in the default list when adding liquidity
export const SUGGESTED_BASES: ChainTokenList = {
  ...WETH_ONLY,
  [ChainId.MAINNET]: [...WETH_ONLY[ChainId.MAINNET], DAI, USDC, USDT],
  [ChainId.FUSE]: [...WETH_ONLY[ChainId.FUSE], FUSE_DAI, FUSE_USDC, FUSE_USDT, FUSE_WBTC, FUSE_WETH]
}

// used to construct the list of all pairs we consider by default in the frontend
export const BASES_TO_TRACK_LIQUIDITY_FOR: ChainTokenList = {
  ...WETH_ONLY,
  [ChainId.MAINNET]: [...WETH_ONLY[ChainId.MAINNET], DAI, USDC, USDT],
  [ChainId.FUSE]: [...WETH_ONLY[ChainId.FUSE], FUSE_DAI, FUSE_USDC, FUSE_USDT, FUSE_WBTC, FUSE_WETH]
}

export const PINNED_PAIRS: { readonly [chainId in ChainId]?: [Token, Token][] } = {
  [ChainId.MAINNET]: [
    [
      new Token(ChainId.MAINNET, '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643', 8, 'cDAI', 'Compound Dai'),
      new Token(ChainId.MAINNET, '0x39AA39c021dfbaE8faC545936693aC917d5E7563', 8, 'cUSDC', 'Compound USD Coin')
    ],
    [USDC, USDT],
    [DAI, USDT]
  ],
  [ChainId.FUSE]: [
    [FUSE_USDC, FUSE_USDT],
    [FUSE_DAI, FUSE_USDT]
  ]
}

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
    color: '#E8831D'
  },
  // WALLET_CONNECT: {
  //   connector: walletconnect,
  //   name: 'WalletConnect',
  //   iconName: 'walletConnectIcon.svg',
  //   description: 'Connect to Trust Wallet, Rainbow Wallet and more...',
  //   href: null,
  //   color: '#4196FC',
  //   mobile: true
  // },
  WALLET_LINK: {
    connector: walletlink,
    name: 'Coinbase Wallet',
    iconName: 'coinbaseWalletIcon.svg',
    description: 'Use Coinbase Wallet app on mobile device',
    href: null,
    color: '#315CF5'
  },
  COINBASE_LINK: {
    name: 'Open in Coinbase Wallet',
    iconName: 'coinbaseWalletIcon.svg',
    description: 'Open in Coinbase Wallet app.',
    href: 'https://go.cb-w.com/mtUDhEZPy1',
    color: '#315CF5',
    mobile: true,
    mobileOnly: true
  }
  // FORTMATIC: {
  //   connector: fortmatic,
  //   name: 'Fortmatic',
  //   iconName: 'fortmaticIcon.png',
  //   description: 'Login using Fortmatic hosted wallet',
  //   href: null,
  //   color: '#6748FF',
  //   mobile: true
  // },
  // Portis: {
  //   connector: portis,
  //   name: 'Portis',
  //   iconName: 'portisIcon.png',
  //   description: 'Login using Portis hosted wallet',
  //   href: null,
  //   color: '#4A6C9B',
  //   mobile: true
  // }
}

export const NetworkContextName = 'NETWORK'

// default allowed slippage, in bips
export const INITIAL_ALLOWED_SLIPPAGE = 50
// 20 minutes, denominated in seconds
export const DEFAULT_DEADLINE_FROM_NOW = 60 * 20

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
export const BETTER_TRADE_LINK_THRESHOLD = new Percent(JSBI.BigInt(75), JSBI.BigInt(10000))

export const UNSUPPORTED_BRIDGE_TOKENS = ['WFUSE']

export const GAS_PRICE = process.env.REACT_APP_GAS_PRICE ?? '1000000000'

import { JSBI, Percent, Token, WETH } from '@uniswap/sdk'

export const FORMATIC_KEY = process.env.REACT_APP_FORTMATIC_KEY
export const PORTIS_ID = process.env.REACT_APP_PORTIS_ID
const INFURA_ID = process.env.REACT_APP_INFURA_ID

//Patches runtime ChainId, for type customization, see types/@uniswap/sdk.d.ts
export enum ChainId {
  MAINNET = 1,
  ROPSTEN = 3,
  RINKEBY = 4,
  GÖRLI = 5,
  KOVAN = 42,
  LOCAL = 5777
}

const constants = {
  supportedChainIds: [ChainId.MAINNET, ChainId.ROPSTEN, ChainId.RINKEBY, ChainId.GÖRLI, ChainId.KOVAN, ChainId.LOCAL],
  [ChainId.MAINNET]: {
    NETWORK_URL: `https://mainnet.infura.io/v3/${INFURA_ID}`,
    PROPOSAL_LENGTH_IN_DAYS: 7,
    GOVERNANCE_ADDRESS: '0x5e4be8Bc9637f0EAA1A755019e06A68ce081D58F',
    ROUTER_ADDRESS: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    UNI_ADDRESS: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    MERKLE_DISTRIBUTOR_ADDRESS: '0x090D4613473dEE047c3f2706764f49E0821D256e',
    V1_FACTORY_ADDRESS: '0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95',
    MULTICALL_ADDRESS: '0xeefBa1e63905eF1D7ACbA5a8513c70307C1cE441',
    tokens: {
      WETH: WETH[ChainId.MAINNET],
      UNI: new Token(ChainId.MAINNET, '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', 18, 'UNI', 'Uniswap'),
      DAI: new Token(ChainId.MAINNET, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18, 'DAI', 'Dai Stablecoin'),
      USDC: new Token(ChainId.MAINNET, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC', 'USD//C'),
      USDT: new Token(ChainId.MAINNET, '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6, 'USDT', 'Tether USD'),
      COMP: new Token(ChainId.MAINNET, '0xc00e94Cb662C3520282E6f5717214004A7f26888', 18, 'COMP', 'Compound'),
      MKR: new Token(ChainId.MAINNET, '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2', 18, 'MKR', 'Maker'),
      AMPL: new Token(ChainId.MAINNET, '0xD46bA6D942050d489DBd938a2C909A5d5039A161', 9, 'AMPL', 'Ampleforth'),
      WBTC: new Token(ChainId.MAINNET, '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', 18, 'WBTC', 'Wrapped BTC'),
      cDAI: new Token(ChainId.MAINNET, '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643', 8, 'cDAI', 'Compound Dai'),
      cUSDC: new Token(ChainId.MAINNET, '0x39AA39c021dfbaE8faC545936693aC917d5E7563', 8, 'cUSDC', 'Compound USD Coin')
    },
    staking: {
      WETH: {
        DAI: { address: '0xa1484C3aa22a66C62b77E0AE78E15258bd0cB711' },
        USDC: { address: '0x7FBa4B8Dc5E7616e59622806932DBea72537A56b' },
        USDT: { address: '0x6C3e4cb2E96B01F4b866965A91ed4437839A121a' },
        WBTC: { address: '0xCA35e32e7926b96A9988f61d510E038108d8068e' }
      }
    }
  },
  [ChainId.ROPSTEN]: {
    NETWORK_URL: `https://ropsten.infura.io/v3/${INFURA_ID}`,
    PROPOSAL_LENGTH_IN_DAYS: 7,
    GOVERNANCE_ADDRESS: '0x0000000000000000000000000000000000000000',
    ROUTER_ADDRESS: '0x0000000000000000000000000000000000000000',
    MERKLE_DISTRIBUTOR_ADDRESS: '0x0000000000000000000000000000000000000000',
    V1_FACTORY_ADDRESS: '0x9c83dCE8CA20E9aAF9D3efc003b2ea62aBC08351',
    MULTICALL_ADDRESS: '0x53C43764255c17BD724F74c4eF150724AC50a3ed',
    tokens: {
      WETH: WETH[ChainId.ROPSTEN],
      UNI: new Token(ChainId.RINKEBY, '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', 18, 'UNI', 'Uniswap'),
    }
  },
  [ChainId.RINKEBY]: {
    NETWORK_URL: `https://rinkeby.infura.io/v3/${INFURA_ID}`,
    PROPOSAL_LENGTH_IN_DAYS: 7,
    GOVERNANCE_ADDRESS: '0x0000000000000000000000000000000000000000',
    ROUTER_ADDRESS: '0x0000000000000000000000000000000000000000',
    UNI_ADDRESS: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    MERKLE_DISTRIBUTOR_ADDRESS: '0x0000000000000000000000000000000000000000',
    V1_FACTORY_ADDRESS: '0xf5D915570BC477f9B8D6C0E980aA81757A3AaC36',
    MULTICALL_ADDRESS: '0x42Ad527de7d4e9d9d011aC45B31D8551f8Fe9821',
    tokens: {
      WETH: WETH[ChainId.RINKEBY],
      UNI: new Token(ChainId.RINKEBY, '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', 18, 'UNI', 'Uniswap'),
    }
  },
  [ChainId.GÖRLI]: {
    NETWORK_URL: `https://goerli.infura.io/v3/${INFURA_ID}`,
    PROPOSAL_LENGTH_IN_DAYS: 7,
    GOVERNANCE_ADDRESS: '0x0000000000000000000000000000000000000000',
    ROUTER_ADDRESS: '0x0000000000000000000000000000000000000000',
    UNI_ADDRESS: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    MERKLE_DISTRIBUTOR_ADDRESS: '0x0000000000000000000000000000000000000000',
    V1_FACTORY_ADDRESS: '0x6Ce570d02D73d4c384b46135E87f8C592A8c86dA',
    MULTICALL_ADDRESS: '0x77dCa2C955b15e9dE4dbBCf1246B4B85b651e50e',
    tokens: {
      WETH: WETH[ChainId.GÖRLI],
      UNI: new Token(ChainId.GÖRLI, '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', 18, 'UNI', 'Uniswap'),
    }
  },
  [ChainId.KOVAN]: {
    NETWORK_URL: `https://kovan.infura.io/v3/${INFURA_ID}`,
    PROPOSAL_LENGTH_IN_DAYS: 7,
    GOVERNANCE_ADDRESS: '0x0000000000000000000000000000000000000000',
    ROUTER_ADDRESS: '0x0000000000000000000000000000000000000000',
    ZERO_ADDRESS: '0x0000000000000000000000000000000000000000',
    UNI_ADDRESS: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    MERKLE_DISTRIBUTOR_ADDRESS: '0x0000000000000000000000000000000000000000',
    V1_FACTORY_ADDRESS: '0xD3E51Ef092B2845f10401a0159B2B96e8B6c3D30',
    MULTICALL_ADDRESS: '0x2cc8688C5f75E365aaEEb4ea8D6a480405A48D2A',
    tokens: {
      WETH: WETH[ChainId.KOVAN],
      UNI: new Token(ChainId.KOVAN, '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', 18, 'UNI', 'Uniswap'),
    }
  },
  [ChainId.LOCAL]: {
    NETWORK_URL: 'http://localhost:7545',
    PROPOSAL_LENGTH_IN_DAYS: 7,
    GOVERNANCE_ADDRESS: '0x0000000000000000000000000000000000000000',
    ROUTER_ADDRESS: '0x0000000000000000000000000000000000000000',
    UNI_ADDRESS: '0x0000000000000000000000000000000000000000',
    MERKLE_DISTRIBUTOR_ADDRESS: '0x0000000000000000000000000000000000000000',
    V1_FACTORY_ADDRESS: '0x0000000000000000000000000000000000000000',
    MULTICALL_ADDRESS: '0x0000000000000000000000000000000000000000',
    tokens: {
      WETH: new Token(ChainId.LOCAL as ChainId, '0x0000000000000000000000000000000000000000', 18, 'WETH', 'Wrapped Ether'),
      UNI: new Token(ChainId.LOCAL as ChainId, '0x0000000000000000000000000000000000000000', 18, 'UNI', 'Uniswap'),
    }
  },
}

//webpack error breaks module extension, use raw networkId
export const NETWORK_URL: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: constants[ChainId.MAINNET].NETWORK_URL,
  [ChainId.ROPSTEN]: constants[ChainId.ROPSTEN].NETWORK_URL,
  [ChainId.RINKEBY]: constants[ChainId.RINKEBY].NETWORK_URL,
  [ChainId.KOVAN]: constants[ChainId.KOVAN].NETWORK_URL,
  [ChainId.GÖRLI]: constants[ChainId.GÖRLI].NETWORK_URL,
  5777: constants[ChainId.LOCAL].NETWORK_URL
}
export const SUPPORTED_CHAIN_IDS: ChainId[] = constants.supportedChainIds

export const ROUTER_ADDRESS: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: constants[ChainId.MAINNET].ROUTER_ADDRESS,
  [ChainId.RINKEBY]: constants[ChainId.RINKEBY].ROUTER_ADDRESS,
  [ChainId.ROPSTEN]: constants[ChainId.ROPSTEN].ROUTER_ADDRESS,
  [ChainId.GÖRLI]: constants[ChainId.GÖRLI].ROUTER_ADDRESS,
  [ChainId.KOVAN]: constants[ChainId.KOVAN].ROUTER_ADDRESS,
  [ChainId.LOCAL]: constants[ChainId.LOCAL].ROUTER_ADDRESS
}

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

// a list of tokens by chain
type ChainTokenList = {
  readonly [chainId in ChainId]: Token[]
}

// TODO this is only approximate, it's actually based on blocks
export const PROPOSAL_LENGTH_IN_DAYS = 7

export const GOVERNANCE_ADDRESS: { [chainId in ChainId]?: string } = {
  [ChainId.MAINNET]: constants[ChainId.MAINNET].GOVERNANCE_ADDRESS
}

export const UNI: { [chainId in ChainId]: Token } = {
  [ChainId.MAINNET]: constants[ChainId.MAINNET].tokens.UNI,
  [ChainId.RINKEBY]: constants[ChainId.RINKEBY].tokens.UNI,
  [ChainId.ROPSTEN]: constants[ChainId.ROPSTEN].tokens.UNI,
  [ChainId.GÖRLI]: constants[ChainId.GÖRLI].tokens.UNI,
  [ChainId.KOVAN]: constants[ChainId.KOVAN].tokens.UNI,
  [ChainId.LOCAL]: constants[ChainId.LOCAL].tokens.UNI
}

// TODO: specify merkle distributor for mainnet
export const MERKLE_DISTRIBUTOR_ADDRESS: { [chainId in ChainId]?: string } = {
  [ChainId.MAINNET]: constants[ChainId.MAINNET].MERKLE_DISTRIBUTOR_ADDRESS
}


// used to construct intermediary pairs for trading
export const BASES_TO_CHECK_TRADES_AGAINST: ChainTokenList = {
  [ChainId.MAINNET]: [constants[ChainId.MAINNET].tokens.WETH, constants[ChainId.MAINNET].tokens.DAI, constants[ChainId.MAINNET].tokens.USDC, constants[ChainId.MAINNET].tokens.USDT, constants[ChainId.MAINNET].tokens.COMP, constants[ChainId.MAINNET].tokens.MKR],
  [ChainId.ROPSTEN]: [constants[ChainId.ROPSTEN].tokens.WETH],
  [ChainId.RINKEBY]: [constants[ChainId.RINKEBY].tokens.WETH],
  [ChainId.GÖRLI]: [constants[ChainId.GÖRLI].tokens.WETH],
  [ChainId.KOVAN]: [constants[ChainId.KOVAN].tokens.WETH],
  [ChainId.LOCAL]: [constants[ChainId.LOCAL].tokens.WETH]
}

/**
 * Some tokens can only be swapped via certain pairs, so we override the list of bases that are considered for these
 * tokens.
 */
export const CUSTOM_BASES: { [chainId in ChainId]?: { [tokenAddress: string]: Token[] } } = {
  [ChainId.MAINNET]: {
    [constants[ChainId.MAINNET].tokens.AMPL.address]: [constants[ChainId.MAINNET].tokens.DAI, constants[ChainId.MAINNET].tokens.WETH]
  }
}

// used for display in the default list when adding liquidity
export const SUGGESTED_BASES: ChainTokenList = {
  [ChainId.MAINNET]: [constants[ChainId.MAINNET].tokens.WETH, constants[ChainId.MAINNET].tokens.DAI, constants[ChainId.MAINNET].tokens.USDC, constants[ChainId.MAINNET].tokens.USDT],
  [ChainId.ROPSTEN]: [constants[ChainId.ROPSTEN].tokens.WETH],
  [ChainId.RINKEBY]: [constants[ChainId.RINKEBY].tokens.WETH],
  [ChainId.GÖRLI]: [constants[ChainId.GÖRLI].tokens.WETH],
  [ChainId.KOVAN]: [constants[ChainId.KOVAN].tokens.WETH],
  [ChainId.LOCAL]: [constants[ChainId.LOCAL].tokens.WETH]
}

// used to construct the list of all pairs we consider by default in the frontend
export const BASES_TO_TRACK_LIQUIDITY_FOR: ChainTokenList = {
  [ChainId.MAINNET]: [constants[ChainId.MAINNET].tokens.WETH, constants[ChainId.MAINNET].tokens.DAI, constants[ChainId.MAINNET].tokens.USDC, constants[ChainId.MAINNET].tokens.USDT],
  [ChainId.ROPSTEN]: [constants[ChainId.ROPSTEN].tokens.WETH],
  [ChainId.RINKEBY]: [constants[ChainId.RINKEBY].tokens.WETH],
  [ChainId.GÖRLI]: [constants[ChainId.GÖRLI].tokens.WETH],
  [ChainId.KOVAN]: [constants[ChainId.KOVAN].tokens.WETH],
  [ChainId.LOCAL]: [constants[ChainId.LOCAL].tokens.WETH]
}

export const PINNED_PAIRS: { readonly [chainId in ChainId]?: [Token, Token][] } = {
  [ChainId.MAINNET]: [
    [
      constants[ChainId.MAINNET].tokens.cDAI,
      constants[ChainId.MAINNET].tokens.cUSDC
    ],
    [constants[ChainId.MAINNET].tokens.USDC, constants[ChainId.MAINNET].tokens.USDT],
    [constants[ChainId.MAINNET].tokens.DAI, constants[ChainId.MAINNET].tokens.USDT]
  ]
}


export const NetworkContextName = 'NETWORK'

// default allowed slippage, in bips
export const INITIAL_ALLOWED_SLIPPAGE = 50
// 20 minutes, denominated in seconds
export const DEFAULT_DEADLINE_FROM_NOW = 60 * 20

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
export const BETTER_TRADE_LINK_THRESHOLD = new Percent(JSBI.BigInt(75), JSBI.BigInt(10000))

export default constants;
// a list of tokens by chain
import { Currency, Token } from '@uniswap/sdk-core'

import { SupportedChainId } from './chains'
import {
  AMPL,
  DAI,
  DAI_ARBITRUM_ONE,
  DAI_OPTIMISM,
  ETH2X_FLI,
  ExtendedEther,
  FEI,
  FRAX,
  FXS,
  renBTC,
  TRIBE,
  USDC,
  USDC_ARBITRUM,
  USDC_OPTIMISM,
  USDT,
  USDT_ARBITRUM_ONE,
  USDT_OPTIMISM,
  WBTC,
  WBTC_ARBITRUM_ONE,
  WBTC_OPTIMISM,
  WETH9_EXTENDED,
} from './tokens'

type ChainTokenList = {
  readonly [chainId: number]: Token[]
}

type ChainCurrencyList = {
  readonly [chainId: number]: Currency[]
}

const WETH_ONLY: ChainTokenList = Object.fromEntries(
  Object.entries(WETH9_EXTENDED).map(([key, value]) => [key, [value]])
)

// used to construct intermediary pairs for trading
export const BASES_TO_CHECK_TRADES_AGAINST: ChainTokenList = {
  ...WETH_ONLY,
  [SupportedChainId.MAINNET]: [...WETH_ONLY[SupportedChainId.MAINNET], DAI, USDC, USDT, WBTC],
  [SupportedChainId.OPTIMISM]: [...WETH_ONLY[SupportedChainId.OPTIMISM], DAI_OPTIMISM, USDT_OPTIMISM, WBTC_OPTIMISM],
  [SupportedChainId.ARBITRUM_ONE]: [
    ...WETH_ONLY[SupportedChainId.ARBITRUM_ONE],
    DAI_ARBITRUM_ONE,
    USDT_ARBITRUM_ONE,
    WBTC_ARBITRUM_ONE,
  ],
}
export const ADDITIONAL_BASES: { [chainId: number]: { [tokenAddress: string]: Token[] } } = {
  [SupportedChainId.MAINNET]: {
    '0xF16E4d813f4DcfDe4c5b44f305c908742De84eF0': [ETH2X_FLI],
    [FEI.address]: [TRIBE],
    [TRIBE.address]: [FEI],
    [FRAX.address]: [FXS],
    [FXS.address]: [FRAX],
    [WBTC.address]: [renBTC],
    [renBTC.address]: [WBTC],
  },
}
/**
 * Some tokens can only be swapped via certain pairs, so we override the list of bases that are considered for these
 * tokens.
 */
export const CUSTOM_BASES: { [chainId: number]: { [tokenAddress: string]: Token[] } } = {
  [SupportedChainId.MAINNET]: {
    [AMPL.address]: [DAI, WETH9_EXTENDED[SupportedChainId.MAINNET]],
  },
}

/**
 * Shows up in the currency select for swap and add liquidity
 */
export const COMMON_BASES: ChainCurrencyList = {
  [SupportedChainId.MAINNET]: [
    ExtendedEther.onChain(SupportedChainId.MAINNET),
    DAI,
    USDC,
    USDT,
    WBTC,
    WETH9_EXTENDED[SupportedChainId.MAINNET],
  ],
  [SupportedChainId.ROPSTEN]: [
    ExtendedEther.onChain(SupportedChainId.ROPSTEN),
    WETH9_EXTENDED[SupportedChainId.ROPSTEN],
  ],
  [SupportedChainId.RINKEBY]: [
    ExtendedEther.onChain(SupportedChainId.RINKEBY),
    WETH9_EXTENDED[SupportedChainId.RINKEBY],
  ],
  [SupportedChainId.GOERLI]: [ExtendedEther.onChain(SupportedChainId.GOERLI), WETH9_EXTENDED[SupportedChainId.GOERLI]],
  [SupportedChainId.KOVAN]: [ExtendedEther.onChain(SupportedChainId.KOVAN), WETH9_EXTENDED[SupportedChainId.KOVAN]],
  [SupportedChainId.ARBITRUM_ONE]: [
    ExtendedEther.onChain(SupportedChainId.ARBITRUM_ONE),
    DAI_ARBITRUM_ONE,
    USDC_ARBITRUM,
    USDT_ARBITRUM_ONE,
    WBTC_ARBITRUM_ONE,
    WETH9_EXTENDED[SupportedChainId.ARBITRUM_ONE],
  ],
  [SupportedChainId.ARBITRUM_RINKEBY]: [
    ExtendedEther.onChain(SupportedChainId.ARBITRUM_RINKEBY),
    WETH9_EXTENDED[SupportedChainId.ARBITRUM_RINKEBY],
  ],
  [SupportedChainId.OPTIMISM]: [
    ExtendedEther.onChain(SupportedChainId.OPTIMISM),
    DAI_OPTIMISM,
    USDC_OPTIMISM,
    USDT_OPTIMISM,
    WBTC_OPTIMISM,
  ],
  [SupportedChainId.OPTIMISTIC_KOVAN]: [ExtendedEther.onChain(SupportedChainId.OPTIMISTIC_KOVAN)],
}

// used to construct the list of all pairs we consider by default in the frontend
export const BASES_TO_TRACK_LIQUIDITY_FOR: ChainTokenList = {
  ...WETH_ONLY,
  [SupportedChainId.MAINNET]: [...WETH_ONLY[SupportedChainId.MAINNET], DAI, USDC, USDT, WBTC],
}
export const PINNED_PAIRS: { readonly [chainId: number]: [Token, Token][] } = {
  [SupportedChainId.MAINNET]: [
    [
      new Token(SupportedChainId.MAINNET, '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643', 8, 'cDAI', 'Compound Dai'),
      new Token(
        SupportedChainId.MAINNET,
        '0x39AA39c021dfbaE8faC545936693aC917d5E7563',
        8,
        'cUSDC',
        'Compound USD Coin'
      ),
    ],
    [USDC, USDT],
    [DAI, USDT],
  ],
}

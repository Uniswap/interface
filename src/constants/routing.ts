// a list of tokens by chain
import { Currency, Token } from '@uniswap/sdk-core'

import { SupportedChainId } from './chains'
import {
  AMPL,
  DAI,
  DAI_ARBITRUM_ONE,
  DAI_OPTIMISM,
  DAI_POLYGON,
  ETH2X_FLI,
  FEI,
  FRAX,
  FXS,
  nativeOnChain,
  renBTC,
  rETH2,
  sETH2,
  SWISE,
  TRIBE,
  USDC_ARBITRUM,
  USDC_MAINNET,
  USDC_OPTIMISM,
  USDC_POLYGON,
  USDT,
  USDT_ARBITRUM_ONE,
  USDT_OPTIMISM,
  USDT_POLYGON,
  WBTC,
  WBTC_ARBITRUM_ONE,
  WBTC_OPTIMISM,
  WBTC_POLYGON,
  WETH_POLYGON,
  WETH_POLYGON_MUMBAI,
  WRAPPED_NATIVE_CURRENCY,
} from './tokens'

type ChainTokenList = {
  readonly [chainId: number]: Token[]
}

type ChainCurrencyList = {
  readonly [chainId: number]: Currency[]
}

const WRAPPED_NATIVE_CURRENCIES_ONLY: ChainTokenList = Object.fromEntries(
  Object.entries(WRAPPED_NATIVE_CURRENCY).map(([key, value]) => [key, [value]])
)

// used to construct intermediary pairs for trading
export const BASES_TO_CHECK_TRADES_AGAINST: ChainTokenList = {
  ...WRAPPED_NATIVE_CURRENCIES_ONLY,
  [SupportedChainId.MAINNET]: [
    ...WRAPPED_NATIVE_CURRENCIES_ONLY[SupportedChainId.MAINNET],
    DAI,
    USDC_MAINNET,
    USDT,
    WBTC,
  ],
  [SupportedChainId.OPTIMISM]: [
    ...WRAPPED_NATIVE_CURRENCIES_ONLY[SupportedChainId.OPTIMISM],
    DAI_OPTIMISM,
    USDT_OPTIMISM,
    WBTC_OPTIMISM,
  ],
  [SupportedChainId.ARBITRUM_ONE]: [
    ...WRAPPED_NATIVE_CURRENCIES_ONLY[SupportedChainId.ARBITRUM_ONE],
    DAI_ARBITRUM_ONE,
    USDT_ARBITRUM_ONE,
    WBTC_ARBITRUM_ONE,
  ],
  [SupportedChainId.POLYGON]: [
    ...WRAPPED_NATIVE_CURRENCIES_ONLY[SupportedChainId.POLYGON],
    DAI_POLYGON,
    USDC_POLYGON,
    USDT_POLYGON,
    WETH_POLYGON,
  ],
}
export const ADDITIONAL_BASES: { [chainId: number]: { [tokenAddress: string]: Token[] } } = {
  [SupportedChainId.MAINNET]: {
    '0xF16E4d813f4DcfDe4c5b44f305c908742De84eF0': [ETH2X_FLI],
    [rETH2.address]: [sETH2],
    [SWISE.address]: [sETH2],
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
    [AMPL.address]: [DAI, WRAPPED_NATIVE_CURRENCY[SupportedChainId.MAINNET]],
  },
}

/**
 * Shows up in the currency select for swap and add liquidity
 */
export const COMMON_BASES: ChainCurrencyList = {
  [SupportedChainId.MAINNET]: [
    nativeOnChain(SupportedChainId.MAINNET),
    DAI,
    USDC_MAINNET,
    USDT,
    WBTC,
    WRAPPED_NATIVE_CURRENCY[SupportedChainId.MAINNET],
  ],
  [SupportedChainId.ROPSTEN]: [
    nativeOnChain(SupportedChainId.ROPSTEN),
    WRAPPED_NATIVE_CURRENCY[SupportedChainId.ROPSTEN],
  ],
  [SupportedChainId.RINKEBY]: [
    nativeOnChain(SupportedChainId.RINKEBY),
    WRAPPED_NATIVE_CURRENCY[SupportedChainId.RINKEBY],
  ],
  [SupportedChainId.GOERLI]: [nativeOnChain(SupportedChainId.GOERLI), WRAPPED_NATIVE_CURRENCY[SupportedChainId.GOERLI]],
  [SupportedChainId.KOVAN]: [nativeOnChain(SupportedChainId.KOVAN), WRAPPED_NATIVE_CURRENCY[SupportedChainId.KOVAN]],
  [SupportedChainId.ARBITRUM_ONE]: [
    nativeOnChain(SupportedChainId.ARBITRUM_ONE),
    DAI_ARBITRUM_ONE,
    USDC_ARBITRUM,
    USDT_ARBITRUM_ONE,
    WBTC_ARBITRUM_ONE,
    WRAPPED_NATIVE_CURRENCY[SupportedChainId.ARBITRUM_ONE],
  ],
  [SupportedChainId.ARBITRUM_RINKEBY]: [
    nativeOnChain(SupportedChainId.ARBITRUM_RINKEBY),
    WRAPPED_NATIVE_CURRENCY[SupportedChainId.ARBITRUM_RINKEBY],
  ],
  [SupportedChainId.OPTIMISM]: [
    nativeOnChain(SupportedChainId.OPTIMISM),
    DAI_OPTIMISM,
    USDC_OPTIMISM,
    USDT_OPTIMISM,
    WBTC_OPTIMISM,
  ],
  [SupportedChainId.OPTIMISTIC_KOVAN]: [nativeOnChain(SupportedChainId.OPTIMISTIC_KOVAN)],
  [SupportedChainId.POLYGON]: [
    nativeOnChain(SupportedChainId.POLYGON),
    WETH_POLYGON,
    USDC_POLYGON,
    DAI_POLYGON,
    USDT_POLYGON,
    WBTC_POLYGON,
  ],
  [SupportedChainId.POLYGON_MUMBAI]: [
    nativeOnChain(SupportedChainId.POLYGON_MUMBAI),
    WRAPPED_NATIVE_CURRENCY[SupportedChainId.POLYGON_MUMBAI],
    WETH_POLYGON_MUMBAI,
  ],
}

// used to construct the list of all pairs we consider by default in the frontend
export const BASES_TO_TRACK_LIQUIDITY_FOR: ChainTokenList = {
  ...WRAPPED_NATIVE_CURRENCIES_ONLY,
  [SupportedChainId.MAINNET]: [
    ...WRAPPED_NATIVE_CURRENCIES_ONLY[SupportedChainId.MAINNET],
    DAI,
    USDC_MAINNET,
    USDT,
    WBTC,
  ],
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
    [USDC_MAINNET, USDT],
    [DAI, USDT],
  ],
}

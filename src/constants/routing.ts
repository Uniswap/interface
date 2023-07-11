// a list of tokens by chain
import { ChainId, Currency, Token } from '@thinkincoin-libs/sdk-core'

import {
  AMPL,
  ARB,
  BTC_BSC,
  BTC_HARMONY,
  BUSD_BSC,
  BUSD_HARMONY,
  CAKE_BSC,
  CEUR_CELO,
  CEUR_CELO_ALFAJORES,
  CMC02_CELO,
  CUSD_CELO,
  CUSD_CELO_ALFAJORES,
  DAI,
  DAI_ARBITRUM_ONE,
  DAI_AVALANCHE,
  DAI_BSC,
  DAI_OPTIMISM,
  DAI_POLYGON,
  ETH_BSC,
  ETH_HARMONY,
  ETH2X_FLI,
  FEI,
  FRAX,
  FRAX_BSC,
  FXS,
  MATIC_BSC,
  NEURONS_HARMONY,
  nativeOnChain,
  OP,
  PORTAL_ETH_CELO,
  PORTAL_USDC_CELO,
  renBTC,
  rETH2,
  sETH2,
  SWISE,
  TRIBE,
  USDC_ARBITRUM,
  USDC_ARBITRUM_GOERLI,
  USDC_AVALANCHE,
  USDC_BSC,
  USDC_HARMONY,
  USDC_MAINNET,
  USDC_OPTIMISM,
  USDC_POLYGON,
  USDT,
  USDT_ARBITRUM_ONE,
  USDT_AVALANCHE,
  USDT_BSC,
  USDT_HARMONY,
  USDT_OPTIMISM,
  USDT_POLYGON,
  WBTC,
  WBTC_ARBITRUM_ONE,
  WBTC_OPTIMISM,
  WBTC_POLYGON,
  WETH_AVALANCHE,
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
  Object.entries(WRAPPED_NATIVE_CURRENCY)
    .map(([key, value]) => [key, [value]])
    .filter(Boolean)
)

// used to construct intermediary pairs for trading
export const BASES_TO_CHECK_TRADES_AGAINST: ChainTokenList = {
  ...WRAPPED_NATIVE_CURRENCIES_ONLY,
  [ChainId.MAINNET]: [...WRAPPED_NATIVE_CURRENCIES_ONLY[ChainId.MAINNET], DAI, USDC_MAINNET, USDT, WBTC],
  [ChainId.OPTIMISM]: [...WRAPPED_NATIVE_CURRENCIES_ONLY[ChainId.OPTIMISM], DAI_OPTIMISM, USDT_OPTIMISM, WBTC_OPTIMISM],
  [ChainId.ARBITRUM_ONE]: [
    ...WRAPPED_NATIVE_CURRENCIES_ONLY[ChainId.ARBITRUM_ONE],
    DAI_ARBITRUM_ONE,
    USDT_ARBITRUM_ONE,
    WBTC_ARBITRUM_ONE,
  ],
  [ChainId.POLYGON]: [
    ...WRAPPED_NATIVE_CURRENCIES_ONLY[ChainId.POLYGON],
    DAI_POLYGON,
    USDC_POLYGON,
    USDT_POLYGON,
    WETH_POLYGON,
  ],
  [ChainId.BNB]: [
    ...WRAPPED_NATIVE_CURRENCIES_ONLY[ChainId.BNB],
    DAI_BSC,
    USDC_BSC,
    USDT_BSC,
    BUSD_BSC,
    FRAX_BSC,
    MATIC_BSC,
    CAKE_BSC,
  ],
  [ChainId.AVALANCHE]: [
    ...WRAPPED_NATIVE_CURRENCIES_ONLY[ChainId.AVALANCHE],
    DAI_AVALANCHE,
    USDC_AVALANCHE,
    USDT_AVALANCHE,
    WETH_AVALANCHE,
  ],
  [ChainId.HARMONY]: [
    ...WRAPPED_NATIVE_CURRENCIES_ONLY[ChainId.HARMONY],
    BTC_HARMONY,
    BUSD_HARMONY,
    USDC_HARMONY,
    USDT_HARMONY,
    ETH_HARMONY,
    NEURONS_HARMONY,
  ],
  [ChainId.CELO]: [CUSD_CELO, CEUR_CELO, CMC02_CELO, PORTAL_USDC_CELO, PORTAL_ETH_CELO],
}
export const ADDITIONAL_BASES: { [chainId: number]: { [tokenAddress: string]: Token[] } } = {
  [ChainId.MAINNET]: {
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
  [ChainId.MAINNET]: {
    [AMPL.address]: [DAI, WRAPPED_NATIVE_CURRENCY[ChainId.MAINNET] as Token],
  },
}

/**
 * Shows up in the currency select for swap and add liquidity
 */
export const COMMON_BASES: ChainCurrencyList = {
  [ChainId.MAINNET]: [
    nativeOnChain(ChainId.MAINNET),
    DAI,
    USDC_MAINNET,
    USDT,
    WBTC,
    WRAPPED_NATIVE_CURRENCY[ChainId.MAINNET] as Token,
  ],
  [ChainId.GOERLI]: [nativeOnChain(ChainId.GOERLI), WRAPPED_NATIVE_CURRENCY[ChainId.GOERLI] as Token],
  [ChainId.SEPOLIA]: [nativeOnChain(ChainId.SEPOLIA), WRAPPED_NATIVE_CURRENCY[ChainId.SEPOLIA] as Token],
  [ChainId.ARBITRUM_ONE]: [
    nativeOnChain(ChainId.ARBITRUM_ONE),
    ARB,
    DAI_ARBITRUM_ONE,
    USDC_ARBITRUM,
    USDT_ARBITRUM_ONE,
    WBTC_ARBITRUM_ONE,
    WRAPPED_NATIVE_CURRENCY[ChainId.ARBITRUM_ONE] as Token,
  ],
  [ChainId.ARBITRUM_GOERLI]: [
    nativeOnChain(ChainId.ARBITRUM_GOERLI),
    WRAPPED_NATIVE_CURRENCY[ChainId.ARBITRUM_GOERLI] as Token,
    USDC_ARBITRUM_GOERLI,
  ],
  [ChainId.OPTIMISM]: [nativeOnChain(ChainId.OPTIMISM), OP, DAI_OPTIMISM, USDC_OPTIMISM, USDT_OPTIMISM, WBTC_OPTIMISM],
  [ChainId.OPTIMISM_GOERLI]: [nativeOnChain(ChainId.OPTIMISM_GOERLI)],
  [ChainId.POLYGON]: [
    nativeOnChain(ChainId.POLYGON),
    WETH_POLYGON,
    USDC_POLYGON,
    DAI_POLYGON,
    USDT_POLYGON,
    WBTC_POLYGON,
  ],
  [ChainId.POLYGON_MUMBAI]: [
    nativeOnChain(ChainId.POLYGON_MUMBAI),
    WRAPPED_NATIVE_CURRENCY[ChainId.POLYGON_MUMBAI] as Token,
    WETH_POLYGON_MUMBAI,
  ],

  [ChainId.CELO]: [nativeOnChain(ChainId.CELO), CEUR_CELO, CUSD_CELO, PORTAL_ETH_CELO, PORTAL_USDC_CELO, CMC02_CELO],
  [ChainId.CELO_ALFAJORES]: [nativeOnChain(ChainId.CELO_ALFAJORES), CUSD_CELO_ALFAJORES, CEUR_CELO_ALFAJORES],

  [ChainId.BNB]: [nativeOnChain(ChainId.BNB), DAI_BSC, USDC_BSC, USDT_BSC, ETH_BSC, BTC_BSC, BUSD_BSC],
  [ChainId.AVALANCHE]: [
    nativeOnChain(ChainId.AVALANCHE),
    DAI_AVALANCHE,
    USDC_AVALANCHE,
    USDT_AVALANCHE,
    WETH_AVALANCHE,
  ],
  [ChainId.HARMONY]: [
    nativeOnChain(ChainId.HARMONY),
    BTC_HARMONY,
    USDC_HARMONY,
    USDT_HARMONY,
    BUSD_HARMONY,
    ETH_HARMONY,
    NEURONS_HARMONY,
  ],
}

// used to construct the list of all pairs we consider by default in the frontend
export const BASES_TO_TRACK_LIQUIDITY_FOR: ChainTokenList = {
  ...WRAPPED_NATIVE_CURRENCIES_ONLY,
  [ChainId.MAINNET]: [...WRAPPED_NATIVE_CURRENCIES_ONLY[ChainId.MAINNET], DAI, USDC_MAINNET, USDT, WBTC],
  [ChainId.BNB]: [
    ...WRAPPED_NATIVE_CURRENCIES_ONLY[ChainId.BNB],
    DAI_BSC,
    USDC_BSC,
    USDT_BSC,
    BTC_BSC,
    BUSD_BSC,
    ETH_BSC,
  ],
  [ChainId.AVALANCHE]: [
    ...WRAPPED_NATIVE_CURRENCIES_ONLY[ChainId.AVALANCHE],
    DAI_AVALANCHE,
    USDC_AVALANCHE,
    USDT_AVALANCHE,
    WETH_AVALANCHE,
  ],
  [ChainId.HARMONY]: [
    ...WRAPPED_NATIVE_CURRENCIES_ONLY[ChainId.HARMONY],
    BTC_HARMONY,
    USDC_HARMONY,
    USDT_HARMONY,
    BUSD_HARMONY,
    ETH_HARMONY,
    NEURONS_HARMONY,
  ],
}
export const PINNED_PAIRS: { readonly [chainId: number]: [Token, Token][] } = {
  [ChainId.MAINNET]: [
    [
      new Token(ChainId.MAINNET, '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643', 8, 'cDAI', 'Compound Dai'),
      new Token(ChainId.MAINNET, '0x39AA39c021dfbaE8faC545936693aC917d5E7563', 8, 'cUSDC', 'Compound USD Coin'),
    ],
    [USDC_MAINNET, USDT],
    [DAI, USDT],
  ],
}

// a list of tokens by chain
import { Currency, Token } from '@uniswap/sdk-core'

import { SupportedChainId } from './chains'
import {
  AMPL,
  CEUR_CELO,
  CEUR_CELO_ALFAJORES,
  CMC02_CELO,
  CUSD_CELO,
  CUSD_CELO_ALFAJORES,
  DAI,
  DAI_ARBITRUM_ONE,
  DAI_OPTIMISM,
  DAI_POLYGON,
  ETH2X_FLI,
  FEI,
  FRAX,
  FXS,
  nativeOnChain,
  PORTAL_ETH_CELO,
  PORTAL_USDC_CELO,
  renBTC,
  rETH2,
  sETH2,
  SWISE,
  TRIBE,
  USDC_ARBITRUM,
  USDC_GOERLI,
  USDC_MAINNET,
  USDC_OPTIMISM,
  USDC_POLYGON,
  USDT,
  USDT_ARBITRUM_ONE,
  USDT_GOERLI,
  USDT_OPTIMISM,
  USDT_POLYGON,
  WBTC,
  WBTC_ARBITRUM_ONE,
  WBTC_GOERLI,
  WBTC_OPTIMISM,
  WBTC_POLYGON,
  WETH_POLYGON,
  WETH_POLYGON_MUMBAI,
  WRAPPED_NATIVE_CURRENCY,
} from './tokens'

type ChainTokenList = {
  readonly [chainId in ChainId]: Token[]
}
// List of all mirror's assets addresses.
// Last pulled from : https://whitelist.mirror.finance/eth/tokenlists.json
// TODO: Generate this programmatically ?
const mAssetsAdditionalBases: { [tokenAddress: string]: Token[] } = {
  [UST.address]: [MIR],
  [MIR.address]: [UST],
  '0xd36932143F6eBDEDD872D5Fb0651f4B72Fd15a84': [MIR, UST], // mAAPL
  '0x59A921Db27Dd6d4d974745B7FfC5c33932653442': [MIR, UST], // mGOOGL
  '0x21cA39943E91d704678F5D00b6616650F066fD63': [MIR, UST], // mTSLA
  '0xC8d674114bac90148d11D3C1d33C61835a0F9DCD': [MIR, UST], // mNFLX
  '0x13B02c8dE71680e71F0820c996E4bE43c2F57d15': [MIR, UST], // mQQQ
  '0xEdb0414627E6f1e3F082DE65cD4F9C693D78CCA9': [MIR, UST], // mTWTR
  '0x41BbEDd7286dAab5910a1f15d12CBda839852BD7': [MIR, UST], // mMSFT
  '0x0cae9e4d663793c2a2A0b211c1Cf4bBca2B9cAa7': [MIR, UST], // mAMZN
  '0x56aA298a19C93c6801FDde870fA63EF75Cc0aF72': [MIR, UST], // mBABA
  '0x1d350417d9787E000cc1b95d70E9536DcD91F373': [MIR, UST], // mIAU
  '0x9d1555d8cB3C846Bb4f7D5B1B1080872c3166676': [MIR, UST], // mSLV
  '0x31c63146a635EB7465e5853020b39713AC356991': [MIR, UST], // mUSO
  '0xf72FCd9DCF0190923Fadd44811E240Ef4533fc86': [MIR, UST], // mVIXY
}
const WETH_ONLY: ChainTokenList = {
  [ChainId.MAINNET]: [WETH9[ChainId.MAINNET]],
  [ChainId.ROPSTEN]: [WETH9[ChainId.ROPSTEN]],
  [ChainId.RINKEBY]: [WETH9[ChainId.RINKEBY]],
  [ChainId.GÖRLI]: [WETH9[ChainId.GÖRLI]],
  [ChainId.KOVAN]: [WETH9[ChainId.KOVAN]],
}
// used to construct intermediary pairs for trading
export const BASES_TO_CHECK_TRADES_AGAINST: ChainTokenList = {
  ...WETH_ONLY,
  [ChainId.MAINNET]: [...WETH_ONLY[ChainId.MAINNET], DAI, USDC, USDT, WBTC],
}
export const ADDITIONAL_BASES: { [chainId in ChainId]?: { [tokenAddress: string]: Token[] } } = {
  [ChainId.MAINNET]: {
    ...mAssetsAdditionalBases,
    '0xA948E86885e12Fb09AfEF8C52142EBDbDf73cD18': [UNI[ChainId.MAINNET]],
    '0x561a4717537ff4AF5c687328c0f7E90a319705C0': [UNI[ChainId.MAINNET]],
    '0xa6e3454fec677772dd771788a079355e43910638': [UMA],
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
export const CUSTOM_BASES: { [chainId in ChainId]?: { [tokenAddress: string]: Token[] } } = {
  [ChainId.MAINNET]: {
    [AMPL.address]: [DAI, WETH9[ChainId.MAINNET]],
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
    WRAPPED_NATIVE_CURRENCY[SupportedChainId.MAINNET] as Token,
  ],
  [SupportedChainId.ROPSTEN]: [
    nativeOnChain(SupportedChainId.ROPSTEN),
    WRAPPED_NATIVE_CURRENCY[SupportedChainId.ROPSTEN] as Token,
  ],
  [SupportedChainId.RINKEBY]: [
    nativeOnChain(SupportedChainId.RINKEBY),
    WRAPPED_NATIVE_CURRENCY[SupportedChainId.RINKEBY] as Token,
  ],
  [SupportedChainId.GOERLI]: [
    nativeOnChain(SupportedChainId.GOERLI),
    USDC_GOERLI,
    WBTC_GOERLI,
    USDT_GOERLI,
    WRAPPED_NATIVE_CURRENCY[SupportedChainId.GOERLI] as Token,
  ],
  [SupportedChainId.KOVAN]: [
    nativeOnChain(SupportedChainId.KOVAN),
    WRAPPED_NATIVE_CURRENCY[SupportedChainId.KOVAN] as Token,
  ],
  [SupportedChainId.ARBITRUM_ONE]: [
    nativeOnChain(SupportedChainId.ARBITRUM_ONE),
    DAI_ARBITRUM_ONE,
    USDC_ARBITRUM,
    USDT_ARBITRUM_ONE,
    WBTC_ARBITRUM_ONE,
    WRAPPED_NATIVE_CURRENCY[SupportedChainId.ARBITRUM_ONE] as Token,
  ],
  [SupportedChainId.ARBITRUM_RINKEBY]: [
    nativeOnChain(SupportedChainId.ARBITRUM_RINKEBY),
    WRAPPED_NATIVE_CURRENCY[SupportedChainId.ARBITRUM_RINKEBY] as Token,
  ],
  [SupportedChainId.OPTIMISM]: [
    nativeOnChain(SupportedChainId.OPTIMISM),
    DAI_OPTIMISM,
    USDC_OPTIMISM,
    USDT_OPTIMISM,
    WBTC_OPTIMISM,
  ],
  [SupportedChainId.OPTIMISM_GOERLI]: [nativeOnChain(SupportedChainId.OPTIMISM_GOERLI)],
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
    WRAPPED_NATIVE_CURRENCY[SupportedChainId.POLYGON_MUMBAI] as Token,
    WETH_POLYGON_MUMBAI,
  ],

  [SupportedChainId.CELO]: [
    nativeOnChain(SupportedChainId.CELO),
    CEUR_CELO,
    CUSD_CELO,
    PORTAL_ETH_CELO,
    PORTAL_USDC_CELO,
    CMC02_CELO,
  ],
  [SupportedChainId.CELO_ALFAJORES]: [
    nativeOnChain(SupportedChainId.CELO_ALFAJORES),
    CUSD_CELO_ALFAJORES,
    CEUR_CELO_ALFAJORES,
  ],
}
// used to construct the list of all pairs we consider by default in the frontend
export const BASES_TO_TRACK_LIQUIDITY_FOR: ChainTokenList = {
  ...WETH_ONLY,
  [ChainId.MAINNET]: [...WETH_ONLY[ChainId.MAINNET], DAI, USDC, USDT, WBTC],
}
export const PINNED_PAIRS: { readonly [chainId in ChainId]?: [Token, Token][] } = {
  [ChainId.MAINNET]: [
    [
      new Token(ChainId.MAINNET, '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643', 8, 'cDAI', 'Compound Dai'),
      new Token(ChainId.MAINNET, '0x39AA39c021dfbaE8faC545936693aC917d5E7563', 8, 'cUSDC', 'Compound USD Coin'),
    ],
    [USDC, USDT],
    [DAI, USDT],
  ],
}

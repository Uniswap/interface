import { ChainId, Token, WETH } from '@kyberswap/ks-sdk-core'

import { AMPL, COMP, DAI, MKR, USDC, USDT, WBTC_ARBITRUM } from './tokens'

// a list of tokens by chain
type ChainTokenList = {
  readonly [chainId in ChainId]: Token[]
}

// help init default values for `BASES_TO_CHECK_TRADES_AGAINST`, `SUGGESTED_BASES` below by ...WETH_ONLY
const WETH_ONLY: ChainTokenList = {
  [ChainId.MAINNET]: [WETH[ChainId.MAINNET]],
  [ChainId.GÖRLI]: [WETH[ChainId.GÖRLI]],
  [ChainId.MATIC]: [WETH[ChainId.MATIC]],
  [ChainId.MUMBAI]: [WETH[ChainId.MUMBAI]],
  [ChainId.BSCTESTNET]: [WETH[ChainId.BSCTESTNET]],
  [ChainId.BSCMAINNET]: [WETH[ChainId.BSCMAINNET]],
  [ChainId.AVAXTESTNET]: [WETH[ChainId.AVAXTESTNET]],
  [ChainId.AVAXMAINNET]: [WETH[ChainId.AVAXMAINNET]],
  [ChainId.FANTOM]: [WETH[ChainId.FANTOM]],
  [ChainId.CRONOS]: [WETH[ChainId.CRONOS]],
  [ChainId.AURORA]: [WETH[ChainId.AURORA]],
  [ChainId.BTTC]: [WETH[ChainId.BTTC]],
  [ChainId.ARBITRUM]: [WETH[ChainId.ARBITRUM]],
  [ChainId.VELAS]: [WETH[ChainId.VELAS]],
  [ChainId.OASIS]: [WETH[ChainId.OASIS]],
  [ChainId.OPTIMISM]: [WETH[ChainId.OPTIMISM]],
  [ChainId.SOLANA]: [WETH[ChainId.SOLANA]],
  [ChainId.ETHW]: [WETH[ChainId.ETHW]],
}

// used to construct intermediary pairs for trading
export const BASES_TO_CHECK_TRADES_AGAINST: ChainTokenList = {
  ...WETH_ONLY,
  [ChainId.MAINNET]: [
    WETH[ChainId.MAINNET],
    DAI[ChainId.MAINNET],
    USDC[ChainId.MAINNET],
    USDT[ChainId.MAINNET],
    COMP,
    MKR,
  ],
  [ChainId.MUMBAI]: [...WETH_ONLY[ChainId.MUMBAI], DAI[ChainId.MUMBAI], USDC[ChainId.MUMBAI], USDT[ChainId.MUMBAI]],
  [ChainId.MATIC]: [
    ...WETH_ONLY[ChainId.MATIC],
    DAI[ChainId.MATIC],
    USDC[ChainId.MATIC],
    USDT[ChainId.MATIC],
    new Token(ChainId.MATIC, '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', 18, 'ETH', 'Ether'),
  ],

  [ChainId.BSCTESTNET]: [
    ...WETH_ONLY[ChainId.BSCTESTNET],
    DAI[ChainId.BSCTESTNET],
    USDC[ChainId.BSCTESTNET],
    USDT[ChainId.BSCTESTNET],
  ],
  [ChainId.BSCMAINNET]: [
    ...WETH_ONLY[ChainId.BSCMAINNET],
    DAI[ChainId.BSCMAINNET],
    USDC[ChainId.BSCMAINNET],
    USDT[ChainId.BSCMAINNET],
    new Token(ChainId.BSCMAINNET, '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', 18, 'BUSD', 'BUSD'),
  ],
  [ChainId.AVAXTESTNET]: [
    ...WETH_ONLY[ChainId.AVAXTESTNET],
    DAI[ChainId.AVAXTESTNET],
    USDC[ChainId.AVAXTESTNET],
    USDT[ChainId.AVAXTESTNET],
  ],
  [ChainId.AVAXMAINNET]: [
    ...WETH_ONLY[ChainId.AVAXMAINNET],
    DAI[ChainId.AVAXMAINNET],
    USDC[ChainId.AVAXMAINNET],
    USDT[ChainId.AVAXMAINNET],
  ],
  [ChainId.FANTOM]: [...WETH_ONLY[ChainId.FANTOM], DAI[ChainId.FANTOM], USDC[ChainId.FANTOM], USDT[ChainId.FANTOM]],
  [ChainId.CRONOS]: [...WETH_ONLY[ChainId.CRONOS], DAI[ChainId.CRONOS], USDC[ChainId.CRONOS], USDT[ChainId.CRONOS]],
  [ChainId.AURORA]: [...WETH_ONLY[ChainId.AURORA], DAI[ChainId.AURORA], USDC[ChainId.AURORA], USDT[ChainId.AURORA]],
  [ChainId.VELAS]: [...WETH_ONLY[ChainId.VELAS], USDC[ChainId.VELAS], USDT[ChainId.VELAS]],
  [ChainId.OASIS]: [...WETH_ONLY[ChainId.OASIS], USDC[ChainId.OASIS], USDT[ChainId.OASIS]],
  [ChainId.BTTC]: [
    ...WETH_ONLY[ChainId.BTTC],
    DAI[ChainId.BTTC],
    USDC[ChainId.BTTC],
    USDT[ChainId.BTTC],
    new Token(ChainId.BTTC, '0xdB28719F7f938507dBfe4f0eAe55668903D34a15', 6, 'USDT_t', 'USDT_t'),
    new Token(ChainId.BTTC, '0xE887512ab8BC60BcC9224e1c3b5Be68E26048B8B', 6, 'USDT_e', 'USDT_e'),
    new Token(ChainId.BTTC, '0xedf53026aea60f8f75fca25f8830b7e2d6200662', 6, 'TRX', 'TRX'),
  ],
  [ChainId.OPTIMISM]: [...WETH_ONLY[ChainId.OPTIMISM], USDC[ChainId.OPTIMISM], USDT[ChainId.OPTIMISM]],
  [ChainId.SOLANA]: [...WETH_ONLY[ChainId.SOLANA], DAI[ChainId.SOLANA], USDC[ChainId.SOLANA], USDT[ChainId.SOLANA]],
}

/**
 * Some tokens can only be swapped via certain pairs, so we override the list of bases that are considered for these
 * tokens.
 */
export const CUSTOM_BASES: { [chainId in ChainId]?: { [tokenAddress: string]: Token[] } } = {
  [ChainId.MAINNET]: {
    [AMPL.address]: [DAI[ChainId.MAINNET], WETH[ChainId.MAINNET]],
  },
}

// used for display common base in currency search
export const SUGGESTED_BASES: ChainTokenList = {
  ...WETH_ONLY,
  [ChainId.MAINNET]: [
    ...WETH_ONLY[ChainId.MAINNET],
    DAI[ChainId.MAINNET],
    USDC[ChainId.MAINNET],
    USDT[ChainId.MAINNET],
    new Token(ChainId.MAINNET, '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0', 18, 'wstETH', 'Wrapped stETH (Lido)'),
  ],
  [ChainId.ETHW]: [USDT[ChainId.ETHW], USDC[ChainId.ETHW]],
  [ChainId.GÖRLI]: [...WETH_ONLY[ChainId.GÖRLI], DAI[ChainId.GÖRLI], USDC[ChainId.GÖRLI], USDT[ChainId.GÖRLI]],
  [ChainId.MATIC]: [
    ...WETH_ONLY[ChainId.MATIC],
    DAI[ChainId.MATIC],
    USDC[ChainId.MATIC],
    USDT[ChainId.MATIC],
    new Token(ChainId.MATIC, '0xa3Fa99A148fA48D14Ed51d610c367C61876997F1', 18, 'MAI', 'MAI'),
    new Token(ChainId.MATIC, '0x3A58a54C066FdC0f2D55FC9C89F0415C92eBf3C4', 18, 'stMATIC', 'Staked MATIC (PoS)'),
  ],
  [ChainId.BSCMAINNET]: [
    ...WETH_ONLY[ChainId.BSCMAINNET],
    DAI[ChainId.BSCMAINNET],
    USDC[ChainId.BSCMAINNET],
    USDT[ChainId.BSCMAINNET],
    new Token(ChainId.BSCMAINNET, '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', 18, 'BUSD', 'BUSD'),
  ],
  [ChainId.AVAXMAINNET]: [
    ...WETH_ONLY[ChainId.AVAXMAINNET],
    USDC[ChainId.AVAXMAINNET],
    USDT[ChainId.AVAXMAINNET],
    new Token(ChainId.AVAXMAINNET, '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', 6, 'USDt', 'TetherToken'),
    new Token(ChainId.AVAXMAINNET, '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', 6, 'USDC', 'USD Coin'),
    new Token(ChainId.AVAXMAINNET, '0x2b2C81e08f1Af8835a78Bb2A90AE924ACE0eA4bE', 18, 'sAVAX', 'Staked AVAX'),
  ],
  [ChainId.FANTOM]: [...WETH_ONLY[ChainId.FANTOM], DAI[ChainId.FANTOM], USDC[ChainId.FANTOM], USDT[ChainId.FANTOM]],
  [ChainId.CRONOS]: [...WETH_ONLY[ChainId.CRONOS], DAI[ChainId.CRONOS], USDC[ChainId.CRONOS], USDT[ChainId.CRONOS]],
  [ChainId.AURORA]: [
    ...WETH_ONLY[ChainId.AURORA],
    DAI[ChainId.AURORA],
    USDC[ChainId.AURORA],
    USDT[ChainId.AURORA],
    new Token(ChainId.AURORA, '0x8BEc47865aDe3B172A928df8f990Bc7f2A3b9f79', 18, 'Aurora', 'Aurora'),
  ],
  [ChainId.ARBITRUM]: [
    ...WETH_ONLY[ChainId.ARBITRUM],
    DAI[ChainId.ARBITRUM],
    USDC[ChainId.ARBITRUM],
    USDT[ChainId.ARBITRUM],
    WBTC_ARBITRUM,
    new Token(ChainId.ARBITRUM, '0x5979D7b546E38E414F7E9822514be443A4800529', 18, 'wstETH', 'Lido Wrapped Staked ETH'),
  ],
  [ChainId.BTTC]: [...WETH_ONLY[ChainId.BTTC], DAI[ChainId.BTTC], USDC[ChainId.BTTC], USDT[ChainId.BTTC]],
  [ChainId.VELAS]: [...WETH_ONLY[ChainId.VELAS], USDC[ChainId.VELAS], USDT[ChainId.VELAS]],
  [ChainId.OASIS]: [...WETH_ONLY[ChainId.OASIS], USDC[ChainId.OASIS], USDT[ChainId.OASIS]],
  [ChainId.OPTIMISM]: [
    ...WETH_ONLY[ChainId.OPTIMISM],
    USDC[ChainId.OPTIMISM],
    new Token(ChainId.OPTIMISM, '0x4200000000000000000000000000000000000042', 18, 'OP', 'Optimism'),
    USDT[ChainId.OPTIMISM],
    DAI[ChainId.OPTIMISM],
    new Token(ChainId.OPTIMISM, '0x1F32b1c2345538c0c6f582fCB022739c4A194Ebb', 18, 'wstETH', 'Lido Wrapped Staked ETH"'),
  ],
  [ChainId.SOLANA]: [...WETH_ONLY[ChainId.SOLANA], USDC[ChainId.SOLANA], USDT[ChainId.SOLANA]],
}

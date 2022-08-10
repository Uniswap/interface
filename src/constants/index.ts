import { ChainId, Percent, Token, WETH } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { AbstractConnector } from '@web3-react/abstract-connector'
import JSBI from 'jsbi'
import { v4 as uuid } from 'uuid'

import { coin98InjectedConnector, injected, ledger, walletconnect, walletlink } from '../connectors'
import { NETWORKS_INFO, SUPPORTED_NETWORKS } from './networks'

export const EMPTY_OBJECT: any = {}
export const EMPTY_ARRAY: any[] = []

export const BAD_RECIPIENT_ADDRESSES: string[] = [
  NETWORKS_INFO[ChainId.MAINNET].classic.static.factory,
  NETWORKS_INFO[ChainId.MAINNET].classic.static.router,
  NETWORKS_INFO[ChainId.MAINNET].classic.static.factory,
  NETWORKS_INFO[ChainId.MAINNET].classic.static.router,
]

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export const DMM_ANALYTICS = 'https://analytics.kyberswap.com/classic'

export const DMM_ANALYTICS_URL: { [chainId in ChainId]: string } = SUPPORTED_NETWORKS.reduce((acc, cur) => {
  return {
    ...acc,
    [cur]: `${DMM_ANALYTICS}/${NETWORKS_INFO[cur].route}`,
  }
}, {}) as { [chainId in ChainId]: string }

export const PROMM_ANALYTICS = 'https://analytics.kyberswap.com/elastic'

export const PROMM_ANALYTICS_URL: { [chainId in ChainId]: string } = SUPPORTED_NETWORKS.reduce((acc, cur) => {
  return {
    ...acc,
    [cur]: `${PROMM_ANALYTICS}/${NETWORKS_INFO[cur].route}`,
  }
}, {}) as { [chainId in ChainId]: string }

// a list of tokens by chain
type ChainTokenList = {
  readonly [chainId in ChainId]: Token[]
}

export const DAI: { [chainId in ChainId]: Token } = {
  [ChainId.MAINNET]: new Token(
    ChainId.MAINNET,
    '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    18,
    'DAI',
    'Dai Stablecoin',
  ),
  [ChainId.ROPSTEN]: new Token(
    ChainId.ROPSTEN,
    '0xaD6D458402F60fD3Bd25163575031ACDce07538D',
    18,
    'DAI',
    'Dai Stablecoin',
  ),
  [ChainId.RINKEBY]: new Token(
    ChainId.RINKEBY,
    '0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735',
    18,
    'DAI',
    'Dai Stablecoin',
  ),
  [ChainId.GÖRLI]: new Token(ChainId.GÖRLI, '0xaD6D458402F60fD3Bd25163575031ACDce07538D', 18, 'DAI', 'Dai Stablecoin'),
  [ChainId.KOVAN]: new Token(ChainId.KOVAN, '0xaD6D458402F60fD3Bd25163575031ACDce07538D', 18, 'DAI', 'Dai Stablecoin'),
  [ChainId.MATIC]: new Token(ChainId.MATIC, '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', 18, 'DAI', 'Dai Stablecoin'),
  [ChainId.MUMBAI]: new Token(
    ChainId.MUMBAI,
    '0x5e2de02472aC02736b43054f095837725A5870eF',
    18,
    'DAI',
    'Dai Stablecoin',
  ),
  [ChainId.BSCTESTNET]: new Token(
    ChainId.BSCTESTNET,
    '0xBb843a2296F9AA49070EB2Dcd482f23548238f65',
    18,
    'DAI',
    'Dai Stablecoin',
  ),
  [ChainId.BSCMAINNET]: new Token(
    ChainId.BSCMAINNET,
    '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3',
    18,
    'DAI',
    'Dai Stablecoin',
  ),
  [ChainId.AVAXTESTNET]: new Token(
    ChainId.AVAXTESTNET,
    '0xE50c0F38a1890Db49d64ac1C4A5B4fe2f02f819d',
    18,
    'DAI',
    'Dai Stablecoin',
  ),
  [ChainId.AVAXMAINNET]: new Token(
    ChainId.AVAXMAINNET,
    '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70',
    18,
    'DAI',
    'Dai Stablecoin',
  ),
  [ChainId.FANTOM]: new Token(
    ChainId.FANTOM,
    '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E',
    18,
    'DAI',
    'Dai Stablecoin',
  ),
  [ChainId.CRONOSTESTNET]: new Token(
    ChainId.CRONOSTESTNET,
    '0xFEC9C3feCB5f17A2C7b01492498D00966E623454',
    18,
    'DAI',
    'Dai Stablecoin',
  ),
  [ChainId.CRONOS]: new Token(
    ChainId.CRONOS,
    '0xF2001B145b43032AAF5Ee2884e456CCd805F677D',
    18,
    'DAI',
    'Dai Stablecoin',
  ),
  [ChainId.ARBITRUM_TESTNET]: new Token(
    ChainId.ARBITRUM_TESTNET,
    '0x340eefA7154BF23e328F59E936568607841FE027',
    18,
    'DAI',
    'Dai Stablecoin',
  ),
  [ChainId.ARBITRUM]: new Token(
    ChainId.ARBITRUM,
    '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    18,
    'DAI_e',
    'Dai Stablecoin_Ethereum',
  ),
  [ChainId.BTTC]: new Token(ChainId.BTTC, '0xe7dC549AE8DB61BDE71F22097BEcc8dB542cA100', 18, 'DAI', 'Dai Stablecoin'),
  [ChainId.AURORA]: new Token(
    ChainId.AURORA,
    '0xe3520349F477A5F6EB06107066048508498A291b',
    18,
    'DAI',
    'Dai Stablecoin',
  ),
  //not existing on Velas
  [ChainId.VELAS]: new Token(ChainId.VELAS, '0xe7dC549AE8DB61BDE71F22097BEcc8dB542cA100', 18, 'DAI', 'Dai Stablecoin'),
  //not existing on Oasis
  [ChainId.OASIS]: new Token(ChainId.OASIS, '0xe7dC549AE8DB61BDE71F22097BEcc8dB542cA100', 18, 'DAI', 'Dai Stablecoin'),
  [ChainId.OPTIMISM]: new Token(
    ChainId.OPTIMISM,
    '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    18,
    'DAI',
    'Dai Stablecoin',
  ),
}

export const USDC: { [chainId in ChainId]: Token } = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC', 'USD Coin'),
  [ChainId.ROPSTEN]: new Token(ChainId.ROPSTEN, '0x068B43f7F2f2c6a662C36E201144aE45f7a1C040', 6, 'USDC', 'USD Coin'),
  [ChainId.RINKEBY]: new Token(ChainId.RINKEBY, '0x4DBCdF9B62e891a7cec5A2568C3F4FAF9E8Abe2b', 6, 'USDC', 'USD Coin'),
  [ChainId.GÖRLI]: new Token(ChainId.GÖRLI, '0x068B43f7F2f2c6a662C36E201144aE45f7a1C040', 6, 'USDC', 'USD Coin'),
  [ChainId.KOVAN]: new Token(ChainId.KOVAN, '0x068B43f7F2f2c6a662C36E201144aE45f7a1C040', 6, 'USDC', 'USD Coin'),
  [ChainId.MATIC]: new Token(ChainId.MATIC, '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', 6, 'USDC', 'USD Coin'),
  [ChainId.MUMBAI]: new Token(ChainId.MUMBAI, '0x2CeC76B26A8d96BF3072D34A01BB3a4edE7c06BE', 6, 'USDC', 'USD Coin'),
  [ChainId.BSCTESTNET]: new Token(
    ChainId.BSCTESTNET,
    '0xb448B701807E644f141a4E4a269aD2F567526505',
    6,
    'USDC',
    'USD Coin',
  ),
  [ChainId.BSCMAINNET]: new Token(
    ChainId.BSCMAINNET,
    '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    18,
    'USDC',
    'USD Coin',
  ),
  [ChainId.AVAXTESTNET]: new Token(
    ChainId.AVAXTESTNET,
    '0x5973774202E8b0ad563A69D502bb0e670e7d00Dd',
    6,
    'USDC',
    'USD Coin',
  ),
  [ChainId.AVAXMAINNET]: new Token(
    ChainId.AVAXMAINNET,
    '0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664',
    6,
    'USDC.e',
    'USD Coin',
  ),
  [ChainId.FANTOM]: new Token(ChainId.FANTOM, '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75', 6, 'USDC', 'USD Coin'),
  [ChainId.CRONOSTESTNET]: new Token(
    ChainId.CRONOSTESTNET,
    '0x136ae5CC3150C4e53AF8b1DC886464CB9AF1AB61',
    6,
    'USDC',
    'USD Coin',
  ),
  [ChainId.CRONOS]: new Token(ChainId.CRONOS, '0xc21223249CA28397B4B6541dfFaEcC539BfF0c59', 6, 'USDC', 'USD Coin'),
  [ChainId.ARBITRUM_TESTNET]: new Token(
    ChainId.ARBITRUM_TESTNET,
    '0xB4BbD0250618917b3679578C58f6440A227C8c03',
    6,
    'USDC',
    'USD Coin',
  ),

  [ChainId.ARBITRUM]: new Token(ChainId.ARBITRUM, '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', 6, 'USDC', 'USD Coin'),
  [ChainId.BTTC]: new Token(ChainId.BTTC, '0xCa424b845497f7204D9301bd13Ff87C0E2e86FCF', 18, 'USDC_b', 'USD Coin_BSC'),
  [ChainId.AURORA]: new Token(ChainId.AURORA, '0xB12BFcA5A55806AaF64E99521918A4bf0fC40802', 6, 'USDC', 'USD Coin'),
  [ChainId.VELAS]: new Token(ChainId.VELAS, '0xe2C120f188eBd5389F71Cf4d9C16d05b62A58993', 6, 'USDC', 'Multichain USDC'),
  [ChainId.OASIS]: new Token(
    ChainId.OASIS,
    '0x80a16016cc4a2e6a2caca8a4a498b1699ff0f844',
    6,
    'USDC',
    'USD Coin (Multichain)',
  ),
  [ChainId.OPTIMISM]: new Token(ChainId.OPTIMISM, '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', 6, 'USDC', 'USD Coin'),
}

export const USDT: { [chainId in ChainId]: Token } = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6, 'USDT', 'Tether USD'),
  [ChainId.ROPSTEN]: new Token(ChainId.ROPSTEN, '0x65Bd1F48f1dd07bb285a3715c588F75684128acE', 6, 'USDT', 'Tether USD'),
  [ChainId.RINKEBY]: new Token(ChainId.RINKEBY, '0xD9BA894E0097f8cC2BBc9D24D308b98e36dc6D02', 18, 'USDT', 'Tether USD'),
  [ChainId.GÖRLI]: new Token(ChainId.GÖRLI, '0x65Bd1F48f1dd07bb285a3715c588F75684128acE', 6, 'USDT', 'Tether USD'),
  [ChainId.KOVAN]: new Token(ChainId.KOVAN, '0x65Bd1F48f1dd07bb285a3715c588F75684128acE', 6, 'USDT', 'Tether USD'),
  [ChainId.MATIC]: new Token(ChainId.MATIC, '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', 6, 'USDT', 'Tether USD'),
  [ChainId.MUMBAI]: new Token(ChainId.MUMBAI, '0x064B91Bda6d178DfE03835de9450BFe78201c43F', 6, 'USDT', 'Tether USD'),
  [ChainId.BSCTESTNET]: new Token(
    ChainId.BSCTESTNET,
    '0x3d8f2Ada8e97e4eF19e4ccBf6ec1Ca52900406aA',
    6,
    'USDT',
    'Tether USD',
  ),
  [ChainId.BSCMAINNET]: new Token(
    ChainId.BSCMAINNET,
    '0x55d398326f99059fF775485246999027B3197955',
    18,
    'USDT',
    'Tether USD',
  ),
  [ChainId.AVAXTESTNET]: new Token(
    ChainId.AVAXTESTNET,
    '0xBD1EEAf651aEB210106E1c1aFb3BC41C388ee577',
    6,
    'USDT',
    'Tether USD',
  ),
  [ChainId.AVAXMAINNET]: new Token(
    ChainId.AVAXMAINNET,
    '0xc7198437980c041c805A1EDcbA50c1Ce5db95118',
    6,
    'USDT.e',
    'Tether USD',
  ),
  [ChainId.FANTOM]: new Token(ChainId.FANTOM, '0x049d68029688eAbF473097a2fC38ef61633A3C7A', 6, 'fUSDT', 'Tether USD'),
  [ChainId.CRONOSTESTNET]: new Token(
    ChainId.CRONOSTESTNET,
    '0x0b19552b293Be73D147159537706450B52f53a61',
    6,
    'USDT',
    'Tether USD',
  ),
  [ChainId.CRONOS]: new Token(ChainId.CRONOS, '0x66e428c3f67a68878562e79A0234c1F83c208770', 6, 'USDT', 'Tether USD'),
  [ChainId.ARBITRUM_TESTNET]: new Token(
    ChainId.ARBITRUM_TESTNET,
    '0x41a56c30b881296859FB4db30Eb9a639B473619B',
    6,
    'USDT',
    'Tether USD',
  ),
  [ChainId.ARBITRUM]: new Token(
    ChainId.ARBITRUM,
    '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    6,
    'USDT',
    'Tether USD',
  ),
  [ChainId.BTTC]: new Token(ChainId.BTTC, '0x9B5F27f6ea9bBD753ce3793a07CbA3C74644330d', 18, 'USDT_b', 'Tether USD_BSC'),
  [ChainId.AURORA]: new Token(ChainId.AURORA, '0x4988a896b1227218e4A686fdE5EabdcAbd91571f', 6, 'USDT', 'Tether USD'),
  [ChainId.VELAS]: new Token(ChainId.VELAS, '0x01445C31581c354b7338AC35693AB2001B50b9aE', 6, 'USDT', 'Multichain USDT'),
  [ChainId.OASIS]: new Token(
    ChainId.OASIS,
    '0xdC19A122e268128B5eE20366299fc7b5b199C8e3',
    6,
    'USDT',
    'Tether USD (Wormhole)',
  ),
  [ChainId.OPTIMISM]: new Token(
    ChainId.OPTIMISM,
    '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    6,
    'USDT',
    'Tether USD',
  ),
}

export const COMP = new Token(ChainId.MAINNET, '0xc00e94Cb662C3520282E6f5717214004A7f26888', 18, 'COMP', 'Compound')
export const MKR = new Token(ChainId.MAINNET, '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2', 18, 'MKR', 'Maker')
export const AMPL = new Token(ChainId.MAINNET, '0xD46bA6D942050d489DBd938a2C909A5d5039A161', 9, 'AMPL', 'Ampleforth')
export const WBTC = new Token(ChainId.MAINNET, '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', 8, 'WBTC', 'Wrapped BTC')
export const WBTC_ARBITRUM = new Token(
  ChainId.ARBITRUM,
  '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f',
  8,
  'WBTC',
  'Wrapped BTC',
)

export const BLOCKS_PER_YEAR = (chainId: ChainId): number =>
  Math.floor((60 / NETWORKS_INFO[chainId].averageBlockTimeInSeconds) * 60 * 24 * 365)

export const SECONDS_PER_YEAR = 31556926

const WETH_ONLY: ChainTokenList = {
  [ChainId.MAINNET]: [WETH[ChainId.MAINNET]],
  [ChainId.ROPSTEN]: [WETH[ChainId.ROPSTEN]],
  [ChainId.RINKEBY]: [WETH[ChainId.RINKEBY]],
  [ChainId.GÖRLI]: [WETH[ChainId.GÖRLI]],
  [ChainId.KOVAN]: [WETH[ChainId.KOVAN]],
  [ChainId.MATIC]: [WETH[ChainId.MATIC]],
  [ChainId.MUMBAI]: [WETH[ChainId.MUMBAI]],
  [ChainId.BSCTESTNET]: [WETH[ChainId.BSCTESTNET]],
  [ChainId.BSCMAINNET]: [WETH[ChainId.BSCMAINNET]],
  [ChainId.AVAXTESTNET]: [WETH[ChainId.AVAXTESTNET]],
  [ChainId.AVAXMAINNET]: [WETH[ChainId.AVAXMAINNET]],
  [ChainId.FANTOM]: [WETH[ChainId.FANTOM]],
  [ChainId.CRONOSTESTNET]: [WETH[ChainId.CRONOSTESTNET]],
  [ChainId.CRONOS]: [WETH[ChainId.CRONOS]],
  [ChainId.AURORA]: [WETH[ChainId.AURORA]],
  [ChainId.BTTC]: [WETH[ChainId.BTTC]],
  [ChainId.ARBITRUM]: [WETH[ChainId.ARBITRUM]],
  [ChainId.ARBITRUM_TESTNET]: [WETH[ChainId.ARBITRUM_TESTNET]],
  [ChainId.VELAS]: [WETH[ChainId.VELAS]],
  [ChainId.OASIS]: [WETH[ChainId.OASIS]],
  [ChainId.OPTIMISM]: [WETH[ChainId.OPTIMISM]],
}

export const KNC_ADDRESS = '0xdeFA4e8a7bcBA345F687a2f1456F5Edd9CE97202'

export const KNC: { [chainId in ChainId]: Token } = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, KNC_ADDRESS, 18, 'KNC', 'Kyber Network Crystal'),
  [ChainId.RINKEBY]: new Token(
    ChainId.RINKEBY,
    '0x8B4DDF9F13f382aff76D262F6C8C50E6d7961b94',
    18,
    'KNC',
    'Kyber Network Crystal',
  ),
  [ChainId.ROPSTEN]: new Token(
    ChainId.ROPSTEN,
    '0x8B4DDF9F13f382aff76D262F6C8C50E6d7961b94',
    18,
    'KNC',
    'Kyber Network Crystal',
  ),
  [ChainId.GÖRLI]: new Token(
    ChainId.GÖRLI,
    '0x8B4DDF9F13f382aff76D262F6C8C50E6d7961b94',
    18,
    'KNC',
    'Kyber Network Crystal',
  ),
  [ChainId.KOVAN]: new Token(
    ChainId.KOVAN,
    '0x8B4DDF9F13f382aff76D262F6C8C50E6d7961b94',
    18,
    'KNC',
    'Kyber Network Crystal',
  ),
  [ChainId.MATIC]: new Token(
    ChainId.MATIC,
    process.env.REACT_APP_MAINNET_ENV === 'staging'
      ? '0x51E8D106C646cA58Caf32A47812e95887C071a62'
      : '0x1C954E8fe737F99f68Fa1CCda3e51ebDB291948C',
    18,
    'KNC',
    'Kyber Network Crystal',
  ),
  [ChainId.MUMBAI]: new Token(
    ChainId.MUMBAI,
    '0xFD1f9381Cb641Dc76Fe8087dbcf8ea84a2c77cbE',
    18,
    'KNC',
    'Kyber Network Crystal',
  ),
  [ChainId.BSCTESTNET]: new Token(
    ChainId.BSCTESTNET,
    '0x51E8D106C646cA58Caf32A47812e95887C071a62',
    18,
    'KNC',
    'Kyber Network Crystal',
  ),
  [ChainId.BSCMAINNET]: new Token(
    ChainId.BSCMAINNET,
    '0xfe56d5892BDffC7BF58f2E84BE1b2C32D21C308b',
    18,
    'KNC',
    'Kyber Network Crystal',
  ),
  [ChainId.AVAXTESTNET]: new Token(ChainId.AVAXTESTNET, KNC_ADDRESS, 18, 'KNC', 'Kyber Network Crystal'),
  [ChainId.AVAXMAINNET]: new Token(
    ChainId.AVAXMAINNET,
    '0x39fC9e94Caeacb435842FADeDeCB783589F50f5f',
    18,
    'KNC',
    'Kyber Network Crystal',
  ),
  [ChainId.FANTOM]: new Token(ChainId.FANTOM, KNC_ADDRESS, 18, 'KNC', 'Kyber Network Crystal'),
  [ChainId.CRONOSTESTNET]: new Token(
    ChainId.CRONOSTESTNET,
    '0x868FC5cB3367C4A43c350b85D5001acaF58A857E',
    18,
    'KNC',
    'Kyber Network Crystal',
  ),
  [ChainId.CRONOS]: new Token(ChainId.CRONOS, KNC_ADDRESS, 18, 'KNC', 'Kyber Network Crystal'),
  [ChainId.AURORA]: new Token(ChainId.AURORA, KNC_ADDRESS, 18, 'KNC', 'Kyber Network Crystal'),

  [ChainId.ARBITRUM_TESTNET]: new Token(
    ChainId.ARBITRUM_TESTNET,
    '0x7596961744096D12eFa3CfA58d1D30EDd82BD396',
    18,
    'KNC',
    'Kyber Network Crystal',
  ),
  [ChainId.BTTC]: new Token(
    ChainId.BTTC,
    '0x18fA72e0EE4C580a129b0CE5bD0694d716C7443E',
    18,
    'KNC_b',
    'Kyber Network Crystal v2 - BSC',
  ),

  // UPDATE WHEN HAS BRIDGE KNC
  [ChainId.ARBITRUM]: new Token(ChainId.ARBITRUM, KNC_ADDRESS, 18, 'KNC', 'Kyber Network Crystal'),
  [ChainId.VELAS]: new Token(ChainId.VELAS, KNC_ADDRESS, 18, 'KNC', 'Kyber Network Crystal'),
  [ChainId.OASIS]: new Token(ChainId.OASIS, KNC_ADDRESS, 18, 'KNC', 'Kyber Network Crystal'),
  [ChainId.OPTIMISM]: new Token(ChainId.OPTIMISM, KNC_ADDRESS, 18, 'KNC', 'Kyber Network Crystal'),
}

export const KNCL_ADDRESS = '0xdd974D5C2e2928deA5F71b9825b8b646686BD200'
export const KNCL_ADDRESS_ROPSTEN = '0x7b2810576aa1cce68f2b118cef1f36467c648f92'

// used to construct intermediary pairs for trading
export const BASES_TO_CHECK_TRADES_AGAINST: ChainTokenList = {
  ...WETH_ONLY,
  [ChainId.MAINNET]: [
    ...WETH_ONLY[ChainId.MAINNET],
    DAI[ChainId.MAINNET],
    USDC[ChainId.MAINNET],
    USDT[ChainId.MAINNET],
    COMP,
    MKR,
  ],
  [ChainId.ROPSTEN]: [
    ...WETH_ONLY[ChainId.ROPSTEN],
    DAI[ChainId.ROPSTEN],
    USDC[ChainId.ROPSTEN],
    USDT[ChainId.ROPSTEN],
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

// used for display in the default list when adding liquidity
export const SUGGESTED_BASES: ChainTokenList = {
  ...WETH_ONLY,
  [ChainId.MAINNET]: [
    ...WETH_ONLY[ChainId.MAINNET],
    DAI[ChainId.MAINNET],
    USDC[ChainId.MAINNET],
    USDT[ChainId.MAINNET],
  ],
  [ChainId.MATIC]: [
    ...WETH_ONLY[ChainId.MATIC],
    DAI[ChainId.MATIC],
    USDC[ChainId.MATIC],
    USDT[ChainId.MATIC],

    new Token(ChainId.MATIC, '0xa3Fa99A148fA48D14Ed51d610c367C61876997F1', 18, 'MAI', 'MAI'),
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
    // DAI[ChainId.AVAXMAINNET],
    USDC[ChainId.AVAXMAINNET],
    USDT[ChainId.AVAXMAINNET],
    // new Token(ChainId.AVAXMAINNET, '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB', 18, 'WETH.e', 'Wrapped Ether'),

    new Token(ChainId.AVAXMAINNET, '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', 6, 'USDt', 'TetherToken'),
    new Token(ChainId.AVAXMAINNET, '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', 6, 'USDC', 'USD Coin'),
  ],

  [ChainId.FANTOM]: [...WETH_ONLY[ChainId.FANTOM], DAI[ChainId.FANTOM], USDC[ChainId.FANTOM], USDT[ChainId.FANTOM]],
  [ChainId.CRONOS]: [...WETH_ONLY[ChainId.CRONOS], DAI[ChainId.CRONOS], USDC[ChainId.CRONOS], USDT[ChainId.CRONOS]],
  [ChainId.AURORA]: [...WETH_ONLY[ChainId.AURORA], DAI[ChainId.AURORA], USDC[ChainId.AURORA], USDT[ChainId.AURORA]],
  [ChainId.ARBITRUM_TESTNET]: [
    ...WETH_ONLY[ChainId.ARBITRUM_TESTNET],
    DAI[ChainId.ARBITRUM_TESTNET],
    USDC[ChainId.ARBITRUM_TESTNET],
    USDT[ChainId.ARBITRUM_TESTNET],
  ],
  [ChainId.ARBITRUM]: [
    ...WETH_ONLY[ChainId.ARBITRUM],
    DAI[ChainId.ARBITRUM],
    USDC[ChainId.ARBITRUM],
    USDT[ChainId.ARBITRUM],
    WBTC_ARBITRUM,
  ],
  [ChainId.BTTC]: [...WETH_ONLY[ChainId.BTTC], DAI[ChainId.BTTC], USDC[ChainId.BTTC], USDT[ChainId.BTTC]],
  [ChainId.VELAS]: [...WETH_ONLY[ChainId.VELAS], USDC[ChainId.VELAS], USDT[ChainId.VELAS]],
  [ChainId.OASIS]: [...WETH_ONLY[ChainId.OASIS], USDC[ChainId.OASIS], USDT[ChainId.OASIS]],
  [ChainId.OPTIMISM]: [
    ...WETH_ONLY[ChainId.OPTIMISM],
    USDC[ChainId.OPTIMISM],
    USDT[ChainId.OPTIMISM],
    DAI[ChainId.OPTIMISM],
  ],
}

// used to construct the list of all pairs we consider by default in the frontend
export const BASES_TO_TRACK_LIQUIDITY_FOR: ChainTokenList = {
  ...WETH_ONLY,
  [ChainId.MAINNET]: [
    ...WETH_ONLY[ChainId.MAINNET],
    DAI[ChainId.MAINNET],
    USDC[ChainId.MAINNET],
    USDT[ChainId.MAINNET],
    KNC[ChainId.MAINNET],
    WBTC,
  ],
  [ChainId.ROPSTEN]: [...WETH_ONLY[ChainId.ROPSTEN], KNC[ChainId.ROPSTEN]],
  [ChainId.MATIC]: [
    ...WETH_ONLY[ChainId.MATIC],
    DAI[ChainId.MATIC],
    USDC[ChainId.MATIC],
    USDT[ChainId.MATIC],
    KNC[ChainId.MATIC],
  ],
  [ChainId.MUMBAI]: [...WETH_ONLY[ChainId.MUMBAI], KNC[ChainId.MUMBAI]],
  [ChainId.BSCMAINNET]: [
    ...WETH_ONLY[ChainId.BSCMAINNET],
    DAI[ChainId.BSCMAINNET],
    USDC[ChainId.BSCMAINNET],
    USDT[ChainId.BSCMAINNET],
    new Token(ChainId.BSCMAINNET, '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', 18, 'BUSD', 'BUSD'),
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
  [ChainId.ARBITRUM]: [
    ...WETH_ONLY[ChainId.ARBITRUM],
    DAI[ChainId.ARBITRUM],
    USDC[ChainId.ARBITRUM],
    USDT[ChainId.ARBITRUM],
  ],
  [ChainId.VELAS]: [...WETH_ONLY[ChainId.VELAS], USDC[ChainId.VELAS], USDT[ChainId.VELAS]],
  [ChainId.OASIS]: [...WETH_ONLY[ChainId.OASIS], USDC[ChainId.OASIS], USDT[ChainId.OASIS]],
}

export const PINNED_PAIRS: { readonly [chainId in ChainId]?: [Token, Token][] } = {
  [ChainId.MAINNET]: [
    [
      new Token(ChainId.MAINNET, '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643', 8, 'cDAI', 'Compound Dai'),
      new Token(ChainId.MAINNET, '0x39AA39c021dfbaE8faC545936693aC917d5E7563', 8, 'cUSDC', 'Compound USD Coin'),
    ],
    [USDC[ChainId.MAINNET], USDT[ChainId.MAINNET]],
    [DAI[ChainId.MAINNET], USDT[ChainId.MAINNET]],
  ],
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
    primary: true,
  },
  METAMASK: {
    connector: injected,
    name: 'MetaMask',
    iconName: 'metamask.svg',
    description: 'Easy-to-use browser extension.',
    href: null,
    color: '#E8831D',
  },
  COIN98: {
    connector: coin98InjectedConnector,
    name: 'Coin98',
    iconName: 'coin98.svg',
    description: 'The Leading Multi-chain Wallet & DeFi Gateway',
    href: null,
    color: 'e6c959',
  },
  WALLET_CONNECT: {
    connector: walletconnect,
    name: 'WalletConnect',
    iconName: 'wallet-connect.svg',
    description: 'Connect to Trust Wallet, Rainbow Wallet and more...',
    href: null,
    color: '#4196FC',
    mobile: true,
  },
  WALLET_LINK: {
    connector: walletlink,
    name: 'Coinbase Wallet',
    iconName: 'wallet-link.svg',
    description: 'Use Coinbase Wallet app on mobile device',
    href: null,
    color: '#315CF5',
  },
  COINBASE_LINK: {
    name: 'Open in Coinbase Wallet',
    iconName: 'wallet-link.svg',
    description: 'Open in Coinbase Wallet app.',
    // To get this link: go to Coinbase app -> Dapp Browser -> go to dmm.exchange -> click "..." button -> share -> copy link
    href: 'https://go.cb-w.com/S7mannYpWjb',
    color: '#315CF5',
    mobile: true,
    mobileOnly: true,
  },
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
  // },
  LEDGER: {
    connector: ledger,
    name: 'Ledger',
    iconName: 'ledger.svg',
    description: 'Ledger Device',
    href: null,
    color: '#315CF5',
  },
  // TREZOR: {
  //   connector: trezor,
  //   name: 'Trezor',
  //   iconName: 'trezor.svg',
  //   description: 'Trezor Device',
  //   href: null,
  //   color: '#315CF5'
  // }
}

export const BLACKLIST_WALLETS: string[] = [
  '0xd882cfc20f52f2599d84b8e8d58c7fb62cfe344b',
  '0x7f367cc41522ce07553e823bf3be79a889debe1b',
  '0x076567024aa84D766803EF0128dc7C58C13a6359',
  '0x901bb9583b24d97e995513c6778dc6888ab6870e',
  '0xa7e5d5a720f06526557c513402f2e6b5fa20b00',
  '0x8576acc5c05d6ce88f4e49bf65bdf0c62f91353c',
  '0x1da5821544e25c636c1417ba96ade4cf6d2f9b5a',
  '0x7db418b5d567a4e0e8c59ad71be1fce48f3e6107',
  '0x72a5843cc08275c8171e582972aa4fda8c397b2a',
  '0x7f19720a857f834887fc9a7bc0a0fbe7fc7f8102',
  '0x9f4cda013e354b8fc285bf4b9a60460cee7f7ea9',
]

export const NetworkContextName = 'NETWORK'

// default allowed slippage, in bips
export const INITIAL_ALLOWED_SLIPPAGE = 50
// 20 minutes, denominated in seconds
export const DEFAULT_DEADLINE_FROM_NOW = 60 * 20
// denominated in seconds
export const TIME_TO_REFRESH_SWAP_RATE = 10

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

export const BUNDLE_ID = '1'

export const ROPSTEN_TOKEN_LOGOS_MAPPING: {
  [key: string]: string
} = {
  '0x8b4ddf9f13f382aff76d262f6c8c50e6d7961b94': '0xdefa4e8a7bcba345f687a2f1456f5edd9ce97202',
  '0x7b2810576aa1cce68f2b118cef1f36467c648f92': '0xdd974d5c2e2928dea5f71b9825b8b646686bd200',
  '0x068b43f7f2f2c6a662c36e201144ae45f7a1c040': '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  '0x65bd1f48f1dd07bb285a3715c588f75684128ace': '0xdac17f958d2ee523a2206206994597c13d831ec7',
  '0xad6d458402f60fd3bd25163575031acdce07538d': '0x6b175474e89094c44da98b954eedeac495271d0f',
  '0x3dff0dce5fc4b367ec91d31de3837cf3840c8284': '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
  '0xa748593dd74e5d0bb38a3f2f5090a0f31370c574': '0xeb4c2781e4eba804ce9a9803c67d0893436bb27d',
  '0xb4f7332ed719eb4839f091eddb2a3ba309739521': '0x514910771af9ca656af840dff83e8264ecf986ca',
  '0xdb0040451f373949a4be60dcd7b6b8d6e42658b6': '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
  '0x787e7339a52d7784a22146da7209c702e1e38511': '0xc00e94cb662c3520282e6f5717214004a7f26888',
  '0x5f4f41e067e8ccf0d1f9ee007223af4d72990cdc': '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
  '0xc778417e063141139fce010982780140aa0cd5ab': '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
}

export const DEFAULT_REWARDS: { [key: string]: string[] } = {
  [ChainId.MAINNET]: ['0x9F52c8ecbEe10e00D9faaAc5Ee9Ba0fF6550F511'],
}

export const OUTSIDE_FAIRLAUNCH_ADDRESSES: {
  // key: fairlaunch address
  [key: string]: {
    address: string
    subgraphAPI: string
    query: string
    name: string
    poolInfoLink: string
    getLPTokenLink: string
  }
} = {
  '0x597e3FeDBC02579232799Ecd4B7edeC4827B0435': {
    address: '0x597e3FeDBC02579232799Ecd4B7edeC4827B0435',
    subgraphAPI: 'https://pancake-subgraph-proxy.kyberswap.com/proxy',
    query: ` { pair(id: "0x4e241e3e76214635eccc7408620b940f0bda267d") {
    id
    token0 {
      id
      symbol
      name
      totalLiquidity
      derivedUSD
      derivedBNB
    }
    token1 {
      id
      symbol
      name
      totalLiquidity
      derivedUSD
    }
    reserve0
    reserve1
    reserveUSD
    totalSupply
    volumeUSD
    untrackedVolumeUSD
    trackedReserveBNB
    token0Price
    token1Price
  }}`,
    name: 'PancakeSwap',
    poolInfoLink: 'https://pancakeswap.finance/info/pool/0x4e241E3E76214635ecCC7408620b940f0bDA267D',
    getLPTokenLink:
      'https://pancakeswap.finance/add/0xc04a23149efdf9a63697f3eb60705147e9f07ffd/0xe9e7cea3dedca5984780bafc599bd69add087d56',
  },
}

export const OUTSITE_FARM_REWARDS_QUERY: {
  [key: string]: {
    subgraphAPI: string
    query: string
  }
} = {
  '0xc04a23149efdF9A63697f3Eb60705147e9f07FfD': {
    subgraphAPI: 'https://pancake-subgraph-proxy.kyberswap.com/proxy',
    query: `{
      tokens(where: {id_in: ["0xc04a23149efdf9a63697f3eb60705147e9f07ffd"]}){
    id
    name
    symbol
    derivedUSD
    derivedBNB
  }
  }`,
  },
}

export const FARMING_POOLS_CHAIN_STAKING_LINK: { [key: string]: string } = {
  '0x9a56f30ff04884cb06da80cb3aef09c6132f5e77':
    'https://sipher.xyz/stake/deposit/kyber-slp-sipher-eth?utm_source=kyberswap',
}

export const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'
export const KNC_COINGECKO_ID = 'kyber-network-crystal'

export const ETHER_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
export const KYBER_NETWORK_DISCORD_URL = 'https://discord.com/invite/NB3vc8J9uv'
export const KYBER_NETWORK_TWITTER_URL = 'https://twitter.com/KyberNetwork'

export const DEFAULT_GAS_LIMIT_MARGIN = 20000

// This variable to handle crazy APR which it can be wrong calculations or a bug
// But now, for FOMO of Pagxy, updated this to 10000 (before we set 2000 for it)
export const MAX_ALLOW_APY = 10000
export const LP_TOKEN_DECIMALS = 18
export const RESERVE_USD_DECIMALS = 100
export const DEFAULT_SIGNIFICANT = 6
export const SUBGRAPH_AMP_MULTIPLIER = 10000
export const AMP_LIQUIDITY_HINT = t`AMP factor x Liquidity in the pool. Amplified pools have higher capital efficiency and liquidity.`
export const AMP_HINT = t`Stands for amplification factor. Each pool can have its own AMP. Pools with a higher AMP provide higher capital efficiency within a particular price range`
export const CREATE_POOL_AMP_HINT = t`Stands for amplification factor. Pools with a higher AMP provide higher capital efficiency within a particular price range. We recommend higher AMP for stable token pairs and lower AMP for volatile token pairs`
export const AGGREGATOR_ROUTER_SWAPPED_EVENT_TOPIC =
  '0xd6d4f5681c246c9f42c203e287975af1601f8df8035a9251f79aab5c8f09e2f8'

export const CLAIM_REWARDS_DATA_URL: { [chainId: number]: string } = {
  [ChainId.ROPSTEN]: '/claim-reward-data.json',
  [ChainId.AVAXMAINNET]:
    'https://raw.githubusercontent.com/KyberNetwork/avax-trading-contest-reward-distribution/develop/results/reward_proof.json',
  [ChainId.MATIC]:
    'https://raw.githubusercontent.com/KyberNetwork/zkyber-reward-distribution/main/results/latest_merkle_data.json',
  [ChainId.BTTC]:
    'https://raw.githubusercontent.com/KyberNetwork/trading-contest-reward-distribution/main/bttc/results/reward_proof.json',
}

export const sentryRequestId = uuid()

// Fee options instead of dynamic fee
export const STATIC_FEE_OPTIONS: { [chainId: number]: number[] | undefined } = {
  [ChainId.ARBITRUM]: [8, 10, 50, 300, 500, 1000],
  [ChainId.ARBITRUM_TESTNET]: [8, 10, 50, 300, 500, 1000],
  [ChainId.AURORA]: [8, 10, 50, 300, 500, 1000],
  [ChainId.VELAS]: [8, 10, 50, 300, 500, 1000],
  [ChainId.OASIS]: [8, 10, 50, 300, 500, 1000],
  [ChainId.MAINNET]: [8, 10, 50, 300, 500, 1000],
  [ChainId.ROPSTEN]: [8, 10, 50, 300, 500, 1000],
  [ChainId.RINKEBY]: [8, 10, 50, 300, 500, 1000],
  [ChainId.MATIC]: [8, 10, 50, 300, 500, 1000],
  [ChainId.AVAXMAINNET]: [8, 10, 50, 300, 500, 1000],
  [ChainId.FANTOM]: [8, 10, 50, 300, 500, 1000],
  [ChainId.BSCMAINNET]: [8, 10, 50, 300, 500, 1000],
  [ChainId.CRONOS]: [8, 10, 50, 300, 500, 1000],
  [ChainId.BTTC]: [8, 10, 50, 300, 500, 1000],
  [ChainId.OPTIMISM]: [8, 10, 50, 300, 500, 1000],
}

export const ONLY_STATIC_FEE_CHAINS = [
  ChainId.ARBITRUM,
  ChainId.ARBITRUM_TESTNET,
  ChainId.AURORA,
  ChainId.VELAS,
  ChainId.OASIS,
  ChainId.OPTIMISM,
] //todo namgold: generate this

// hardcode for unavailable subgraph
export const ONLY_DYNAMIC_FEE_CHAINS: ChainId[] = []

export const TRENDING_SOON_ITEM_PER_PAGE = 10
export const TRENDING_SOON_MAX_ITEMS = 50
export const TRENDING_ITEM_PER_PAGE = 25
export const TRENDING_MAX_ITEM = 50
export const CAMPAIGN_LEADERBOARD_ITEM_PER_PAGE = 10
export const CAMPAIGN_YOUR_TRANSACTIONS_ITEM_PER_PAGE = 10000

// Keys are present_on_chains' value.
export const TRENDING_SOON_SUPPORTED_NETWORKS: { [p: string]: ChainId } = {
  eth: ChainId.MAINNET,
  bsc: ChainId.BSCMAINNET,
  polygon: ChainId.MATIC,
  avax: ChainId.AVAXMAINNET,
  fantom: ChainId.FANTOM,
}

export const TOBE_EXTENDED_FARMING_POOLS: { [key: string]: number } = {
  '0xD185094b8F3DF34d28d3f8740bAf5664Eb5b8636': 1651928400,
  '0xa6bb71128B8F27a8a54a2087ef6E95249723C038': 1651928400,

  '0xC6BC80490A3D022ac888b26A5Ae4f1fad89506Bd': 1651222800,
  '0x9dD156dF57ad44c23f6e1FCB731C640B127fE2Be': 1651222800,
}

export const ELASTIC_BASE_FEE_UNIT = 100_000
export const KYBERSWAP_SOURCE = '{"source":"kyberswap"}'

const CAMPAIGN_BASE_URL = `${process.env.REACT_APP_CAMPAIGN_BASE_URL}/api/v1/campaigns`
export const SWR_KEYS = {
  getListCampaign: CAMPAIGN_BASE_URL,
  getLeaderboard: (id: number) => CAMPAIGN_BASE_URL + '/' + id + '/leaderboard',
  getLuckyWinners: (id: number) => CAMPAIGN_BASE_URL + '/' + id + '/lucky-winners',
  getCampaignTransactions: (campaignId: number, limit: number, offset: number, account: string) =>
    `${CAMPAIGN_BASE_URL}/${campaignId}/proofs?limit=${limit}&offset=${offset}&userAddress=${account}`,
}

// Epsilon 0 is absolute permittivity of free space whose value is 8.854×10^-12 and unit is C^2N^-1m–2.
export const EPSILON = 0.000000000008854

// https://www.nasdaq.com/glossary/b/bip
export const MAX_SLIPPAGE_IN_BIPS = 2000

export const DEFAULT_OUTPUT_TOKEN_BY_CHAIN: Partial<Record<ChainId, Token>> = {
  [ChainId.MAINNET]: USDT[ChainId.MAINNET],
  [ChainId.MATIC]: USDT[ChainId.MATIC],
  [ChainId.BSCMAINNET]: new Token(ChainId.BSCMAINNET, '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', 18, 'BUSD', 'BUSD'),
  [ChainId.AVAXMAINNET]: USDC[ChainId.AVAXMAINNET], // USDC.e
  [ChainId.FANTOM]: USDC[ChainId.FANTOM],
  [ChainId.CRONOS]: USDC[ChainId.CRONOS],
  [ChainId.ARBITRUM]: USDC[ChainId.ARBITRUM],
  [ChainId.OPTIMISM]: USDC[ChainId.OPTIMISM],
  [ChainId.VELAS]: USDC[ChainId.VELAS],
  [ChainId.AURORA]: USDC[ChainId.AURORA],
  [ChainId.OASIS]: USDC[ChainId.OASIS],
  [ChainId.BTTC]: USDT[ChainId.BTTC], // USDT_b
}

export const AGGREGATOR_WAITING_TIME = 1700 // 1700 means that we at least show '.' '..' '...' '.' '..' '...'

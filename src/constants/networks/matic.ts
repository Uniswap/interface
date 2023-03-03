import { ChainId } from '@kyberswap/ks-sdk-core'

import Polygon from 'assets/networks/polygon-network.png'
import { KS_SETTING_API } from 'constants/env'
import { EVMNetworkInfo } from 'constants/networks/type'

const EMPTY = ''
const NOT_SUPPORT = null

const maticInfo: EVMNetworkInfo = {
  chainId: ChainId.MATIC,
  route: 'polygon',
  ksSettingRoute: 'polygon',
  priceRoute: 'polygon',
  poolFarmRoute: 'polygon',
  aggregatorRoute: 'polygon',
  name: 'Polygon',
  icon: Polygon,
  iconDark: NOT_SUPPORT,
  iconSelected: NOT_SUPPORT,
  iconDarkSelected: NOT_SUPPORT,
  defaultBlockSubgraph: 'https://api.thegraph.com/subgraphs/name/dynamic-amm/ethereum-blocks-polygon',
  etherscanUrl: 'https://polygonscan.com',
  etherscanName: 'Polygonscan',
  tokenListUrl: `${KS_SETTING_API}/v1/tokens?chainIds=${ChainId.MATIC}&isWhitelisted=${true}`,
  bridgeURL: EMPTY,
  nativeToken: {
    symbol: 'MATIC',
    name: 'Polygon',
    logo: Polygon,
    decimal: 18,
    minForGas: 10 ** 17,
  },
  defaultRpcUrl: 'https://polygon.kyberengineering.io',
  multicall: '0xed386Fe855C1EFf2f843B910923Dd8846E45C5A4',
  classic: {
    defaultSubgraph: 'https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-exchange-polygon',
    // defaultSubgraph: (
    //   'https://polygon-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-exchange-polygon',
    // ),
    static: {
      zap: '0x2abE8750e4a65584d7452316356128C936273e0D',
      router: '0x5649B4DD00780e99Bab7Abb4A3d581Ea1aEB23D0',
      factory: '0x1c758aF0688502e49140230F6b0EBd376d429be5',
    },
    oldStatic: NOT_SUPPORT,
    dynamic: {
      zap: '0x83D4908c1B4F9Ca423BEE264163BC1d50F251c31',
      router: '0x546C79662E028B661dFB4767664d0273184E4dD1',
      factory: '0x5F1fe642060B5B9658C15721Ea22E982643c095c',
    },
    claimReward: '0x89929Bc485cE72D2Af7b7283B40b921e9F4f80b3',
    fairlaunch: [
      '0xc39bD0fAE646Cb026C73943C5B50E703de2a6532',
      '0xc940acee228893c14274eF1bB64e631308E96e1A',
      '0x7EB05d3115984547a50Ff0e2d247fB6948E1c252',
      '0xc0601973451d9369252Aee01397c0270CD2Ecd60',
      '0x829c27fd3013b944cbE76E92c3D6c45767c0C789',
      '0x3aDd3034Fcf921F20c74c6149FB44921709595B1',
    ],
    fairlaunchV2: ['0xFFD22921947D75342BFE1f8efAcEE4B8B3b5183F'],
  },
  elastic: {
    defaultSubgraph: 'https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-matic',
    startBlock: 29347468,
    coreFactory: '0x5F1dddbf348aC2fbe22a163e30F99F9ECE3DD50a',
    nonfungiblePositionManager: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
    tickReader: '0x165c68077ac06c83800d19200e6E2B08D02dE75D',
    initCodeHash: '0xc597aba1bb02db42ba24a8878837965718c032f8b46be94a6e46452a9f89ca01',
    quoter: '0x0D125c15D54cA1F8a813C74A81aEe34ebB508C1f',
    routers: '0xC1e7dFE73E1598E3910EF4C7845B68A9Ab6F4c83',
    farms: ['0xBdEc4a045446F583dc564C0A227FFd475b329bf0', '0x5C503D4b7DE0633f031229bbAA6A5e4A31cc35d8'],
  },
  limitOrder: {
    development: '0x3C2E9227A6d3779e5b469E425CAa7067b40Ff124',
    production: '0x227B0c196eA8db17A665EA6824D972A64202E936',
  },
  averageBlockTimeInSeconds: 2.6,
  coingeckoNetworkId: 'polygon-pos',
  coingeckoNativeTokenId: 'matic-network',
  deBankSlug: 'matic',
  trueSightId: 'polygon',
  dexToCompare: 'quickswap',
}

export default maticInfo

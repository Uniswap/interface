import { ChainId } from '@kyberswap/ks-sdk-core'

import EthereumLogo from 'assets/images/ethereum-logo.png'
import ARBITRUM from 'assets/networks/arbitrum-network.svg'
import { AGGREGATOR_API, KS_SETTING_API } from 'constants/env'
import { EVMNetworkInfo } from 'constants/networks/type'
import { createClient } from 'utils/client'

const EMPTY = ''
const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const arbitrumInfo: EVMNetworkInfo = {
  chainId: ChainId.ARBITRUM,
  route: 'arbitrum',
  ksSettingRoute: 'arbitrum',
  priceRoute: 'arbitrum',
  poolFarmRoute: 'arbitrum',
  name: 'Arbitrum',
  icon: ARBITRUM,
  iconDark: NOT_SUPPORT,
  iconSelected: NOT_SUPPORT,
  iconDarkSelected: NOT_SUPPORT,
  blockClient: createClient('https://api.thegraph.com/subgraphs/name/kybernetwork/arbitrum-blocks'),
  etherscanUrl: 'https://arbiscan.io',
  etherscanName: 'Arbiscan',
  tokenListUrl: `${KS_SETTING_API}/v1/tokens?chainIds=${ChainId.ARBITRUM}&isWhitelisted=${true}`,
  bridgeURL: EMPTY,
  nativeToken: {
    symbol: 'ETH',
    name: 'ETH',
    logo: EthereumLogo,
    decimal: 18,
    minForGas: 10 ** 16,
  },
  rpcUrl: 'https://arbitrum.kyberengineering.io',
  routerUri: `${AGGREGATOR_API}/arbitrum/route/encode`,
  multicall: '0x80C7DD17B01855a6D2347444a0FCC36136a314de', // must use this for arbitrum to get exactly block number instead of L1 block number
  classic: {
    client: createClient(
      'https://arbitrum-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-exchange-arbitrum',
    ),
    static: {
      zap: '0x2abE8750e4a65584d7452316356128C936273e0D',
      router: '0x5649B4DD00780e99Bab7Abb4A3d581Ea1aEB23D0',
      factory: '0x1c758aF0688502e49140230F6b0EBd376d429be5',
    },
    oldStatic: {
      zap: '0xf530a090EF6481cfB33F98c63532E7745abab58A',
      router: '0xC3E2aED41ECdFB1ad41ED20D45377Da98D5489dD',
      factory: '0x51E8D106C646cA58Caf32A47812e95887C071a62',
    },
    dynamic: NOT_SUPPORT,
    claimReward: NOT_SUPPORT,
    fairlaunch: EMPTY_ARRAY,
    fairlaunchV2: ['0xE8144386BF00f168ed7a0E0D821AC18e02a461BA'],
  },
  elastic: {
    client: createClient('https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-arbitrum-one'),
    startBlock: 14137735,
    coreFactory: '0x5F1dddbf348aC2fbe22a163e30F99F9ECE3DD50a',
    nonfungiblePositionManager: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
    tickReader: '0x165c68077ac06c83800d19200e6E2B08D02dE75D',
    initCodeHash: '0xc597aba1bb02db42ba24a8878837965718c032f8b46be94a6e46452a9f89ca01',
    quoter: '0x0D125c15D54cA1F8a813C74A81aEe34ebB508C1f',
    routers: '0xC1e7dFE73E1598E3910EF4C7845B68A9Ab6F4c83',
    farms: ['0xBdEc4a045446F583dc564C0A227FFd475b329bf0'],
  },
  limitOrder: {
    production: '0x227B0c196eA8db17A665EA6824D972A64202E936',
    development: '0x9deCa89E0934a5E0F187a1865299a9a586550864',
  },
  averageBlockTimeInSeconds: 1, // TODO: check these info
  coingeckoNetworkId: 'arbitrum-one',
  coingeckoNativeTokenId: 'ethereum',
  deBankSlug: 'arb',
  trueSightId: NOT_SUPPORT,
  dexToCompare: 'uniswapv3',
}

export default arbitrumInfo

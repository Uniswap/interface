import { ChainId } from '@kyberswap/ks-sdk-core'

import Polygon from 'assets/networks/polygon-network.png'
import { KS_SETTING_API } from 'constants/env'
import { EVMNetworkInfo } from 'constants/networks/type'

const EMPTY = ''
const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const mumbaiInfo: EVMNetworkInfo = {
  chainId: ChainId.MUMBAI,
  route: 'mumbai',
  ksSettingRoute: 'mumbai',
  priceRoute: 'mumbai',
  poolFarmRoute: EMPTY,
  aggregatorRoute: 'mumbai',
  name: 'Mumbai',
  icon: Polygon,
  iconDark: NOT_SUPPORT,
  iconSelected: NOT_SUPPORT,
  iconDarkSelected: NOT_SUPPORT,
  defaultBlockSubgraph: 'https://api.thegraph.com/subgraphs/name/piavgh/mumbai-blocks',
  etherscanUrl: 'https://mumbai.polygonscan.com/',
  etherscanName: 'Polygonscan',
  tokenListUrl: `${KS_SETTING_API}/v1/tokens?chainIds=${ChainId.MUMBAI}&isWhitelisted=${true}`,
  bridgeURL: EMPTY,
  nativeToken: {
    symbol: 'MATIC',
    name: 'Polygon',
    logo: Polygon,
    decimal: 18,
    minForGas: 10 ** 16,
  },
  defaultRpcUrl: 'https://rpc-mumbai.maticvigil.com',
  multicall: '0xc535D6463D5Bf9843aFa73bBF49bF4644a3988bA',
  classic: {
    defaultSubgraph: 'https://api.thegraph.com/subgraphs/name/piavgh/dmm-exchange-mumbai',
    static: {
      zap: EMPTY,
      router: EMPTY,
      factory: EMPTY,
    },
    oldStatic: NOT_SUPPORT,
    dynamic: {
      zap: EMPTY,
      router: '0xD536e64EAe5FBc62E277167e758AfEA570279956',
      factory: '0x7900309d0b1c8D3d665Ae40e712E8ba4FC4F5453',
    },
    claimReward: NOT_SUPPORT,
    fairlaunch: ['0x882233B197F9e50b1d41F510fD803a510470d7a6'],
    fairlaunchV2: EMPTY_ARRAY,
  },
  elastic: {
    defaultSubgraph: 'https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-matic', //todo: not exits yet
    startBlock: 29347468,
    coreFactory: '0x5F1dddbf348aC2fbe22a163e30F99F9ECE3DD50a',
    nonfungiblePositionManager: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
    tickReader: '0xe3AC3fd66EB31cAf4EE0831b262D837c479FFCe5',
    initCodeHash: '0xc597aba1bb02db42ba24a8878837965718c032f8b46be94a6e46452a9f89ca01',
    quoter: '0x0D125c15D54cA1F8a813C74A81aEe34ebB508C1f',
    routers: '0xC1e7dFE73E1598E3910EF4C7845B68A9Ab6F4c83',
    farms: [],
  },
  limitOrder: { development: NOT_SUPPORT, production: NOT_SUPPORT },
  averageBlockTimeInSeconds: 2.6,
  coingeckoNetworkId: 'polygon-pos',
  coingeckoNativeTokenId: 'matic-network',
  deBankSlug: EMPTY,
  trueSightId: NOT_SUPPORT,
  dexToCompare: NOT_SUPPORT,
}

export default mumbaiInfo

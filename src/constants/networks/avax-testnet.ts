import { ChainId } from '@kyberswap/ks-sdk-core'

import AVAX from 'assets/networks/avax-network.png'
import { KS_SETTING_API } from 'constants/env'
import { EVMNetworkInfo } from 'constants/networks/type'
import { createClient } from 'utils/client'

const EMPTY = ''
const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const avaxTestnetInfo: EVMNetworkInfo = {
  chainId: ChainId.AVAXTESTNET,
  route: 'avalanche-testnet',
  ksSettingRoute: 'avalanche',
  priceRoute: 'avalanche',
  poolFarmRoute: EMPTY,
  name: 'Avalanche Testnet',
  icon: AVAX,
  iconDark: NOT_SUPPORT,
  iconSelected: NOT_SUPPORT,
  iconDarkSelected: NOT_SUPPORT,
  blockClient: createClient('https://api.thegraph.com/subgraphs/name/ducquangkstn/ethereum-block-fuji'),
  etherscanUrl: 'https://testnet.snowtrace.io',
  etherscanName: 'Snowtrace',
  tokenListUrl: `${KS_SETTING_API}/v1/tokens?chainIds=${ChainId.AVAXTESTNET}&isWhitelisted=${true}`,
  bridgeURL: EMPTY,
  nativeToken: {
    symbol: 'AVAX',
    name: 'AVAX',
    logo: AVAX,
    decimal: 18,
    minForGas: 10 ** 16,
  },
  rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
  routerUri: `https://aggregator-api.stg.kyberengineering.io/fuji/route/encode`,
  multicall: '0x5D605e78bc699fB565E6E6a1fa2d940C40F8ce25',
  classic: {
    client: createClient('https://api.thegraph.com/subgraphs/name/ducquangkstn/dmm-exchange-fuij'),
    static: {
      zap: EMPTY,
      router: EMPTY,
      factory: EMPTY,
    },
    oldStatic: NOT_SUPPORT,
    dynamic: {
      zap: EMPTY,
      router: '0x19395624C030A11f58e820C3AeFb1f5960d9742a',
      factory: '0x7900309d0b1c8D3d665Ae40e712E8ba4FC4F5453',
    },
    claimReward: NOT_SUPPORT,
    fairlaunch: [],
    fairlaunchV2: EMPTY_ARRAY,
  },
  elastic: {
    client: createClient('https://api.thegraph.com/subgraphs/name/viet-nv/elastic-fuji'),
    startBlock: 12351427,
    coreFactory: '0x6992a3c0613485644a634bfe22ea97b04f0916aa',
    nonfungiblePositionManager: '0x0C1f1B3608C10DD4E95EBca5a776f004B7EDFdb2',
    tickReader: '0xe3AC3fd66EB31cAf4EE0831b262D837c479FFCe5',
    initCodeHash: '0xc597aba1bb02db42ba24a8878837965718c032f8b46be94a6e46452a9f89ca01',
    quoter: '0x9CFf23e05A18b6f8Aff587B7fEf64F9580A6C85E',
    routers: '0xd74134d330FB567abD08675b57dD588a7447b5Ac',
    farms: [],
  },
  limitOrder: {
    production: NOT_SUPPORT,
    development: NOT_SUPPORT,
  },
  averageBlockTimeInSeconds: 1.85,
  coingeckoNetworkId: 'avalanche',
  coingeckoNativeTokenId: 'avalanche-2',
  deBankSlug: EMPTY,
  trueSightId: NOT_SUPPORT,
  dexToCompare: NOT_SUPPORT,
}

export default avaxTestnetInfo

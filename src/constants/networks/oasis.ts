import { ChainId } from '@kyberswap/ks-sdk-core'

import OASIS from 'assets/networks/oasis-network.svg'
import { KS_SETTING_API } from 'constants/env'
import { EVMNetworkInfo } from 'constants/networks/type'

const EMPTY = ''
const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const oasisInfo: EVMNetworkInfo = {
  chainId: ChainId.OASIS,
  route: 'oasis',
  ksSettingRoute: 'oasis',
  priceRoute: 'oasis',
  poolFarmRoute: 'oasis',
  aggregatorRoute: 'oasis',
  name: 'Oasis',
  icon: OASIS,
  iconDark: NOT_SUPPORT,
  iconSelected: NOT_SUPPORT,
  iconDarkSelected: NOT_SUPPORT,
  defaultBlockSubgraph: 'https://oasis-graph.kyberengineering.io/subgraphs/name/kybernetwork/oasis-blocks',
  etherscanUrl: 'https://explorer.emerald.oasis.dev',
  etherscanName: 'Oasis Emerald Explorer',
  tokenListUrl: `${KS_SETTING_API}/v1/tokens?chainIds=${ChainId.OASIS}&isWhitelisted=${true}`,
  bridgeURL: EMPTY,
  nativeToken: {
    symbol: 'ROSE',
    name: 'ROSE',
    logo: OASIS,
    decimal: 18,
    minForGas: 10 ** 16,
  },
  defaultRpcUrl: 'https://oasis.kyberengineering.io',
  multicall: '0xBF69a56D35B8d6f5A8e0e96B245a72F735751e54',
  classic: {
    defaultSubgraph: 'https://oasis-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-exchange-oasis',
    static: {
      zap: '0x2abE8750e4a65584d7452316356128C936273e0D',
      router: '0x5649B4DD00780e99Bab7Abb4A3d581Ea1aEB23D0',
      factory: '0x1c758aF0688502e49140230F6b0EBd376d429be5',
    },
    oldStatic: {
      zap: '0x83D4908c1B4F9Ca423BEE264163BC1d50F251c31',
      router: '0xEaE47c5D99f7B31165a7f0c5f7E0D6afA25CFd55',
      factory: '0xD9bfE9979e9CA4b2fe84bA5d4Cf963bBcB376974',
    },
    dynamic: NOT_SUPPORT,
    claimReward: NOT_SUPPORT,
    fairlaunch: EMPTY_ARRAY,
    fairlaunchV2: EMPTY_ARRAY,
  },
  elastic: {
    defaultSubgraph: 'https://oasis-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-oasis',
    startBlock: 1656923,
    coreFactory: '0x5F1dddbf348aC2fbe22a163e30F99F9ECE3DD50a',
    nonfungiblePositionManager: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
    tickReader: '0x165c68077ac06c83800d19200e6E2B08D02dE75D',
    initCodeHash: '0xc597aba1bb02db42ba24a8878837965718c032f8b46be94a6e46452a9f89ca01',
    quoter: '0x0D125c15D54cA1F8a813C74A81aEe34ebB508C1f',
    routers: '0xC1e7dFE73E1598E3910EF4C7845B68A9Ab6F4c83',
    farms: [],
  },
  limitOrder: {
    development: NOT_SUPPORT,
    production: NOT_SUPPORT,
  },
  averageBlockTimeInSeconds: 10,
  coingeckoNetworkId: 'oasis',
  coingeckoNativeTokenId: 'oasis-network',
  deBankSlug: EMPTY,
  trueSightId: NOT_SUPPORT,
  dexToCompare: 'valleyswap-v2',
}

export default oasisInfo

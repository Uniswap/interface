import { ChainId } from '@kyberswap/ks-sdk-core'

import EthereumLogo from 'assets/images/ethereum-logo.png'
import AURORA from 'assets/networks/aurora-network.svg'
import { AGGREGATOR_API, KS_SETTING_API } from 'constants/env'
import { EVMNetworkInfo } from 'constants/networks/type'
import { createClient } from 'utils/client'

const EMPTY = ''
const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const auroraInfo: EVMNetworkInfo = {
  chainId: ChainId.AURORA,
  route: 'aurora',
  ksSettingRoute: 'aurora',
  priceRoute: 'aurora',
  poolFarmRoute: 'aurora',
  name: 'Aurora',
  icon: AURORA,
  iconDark: NOT_SUPPORT,
  iconSelected: NOT_SUPPORT,
  iconDarkSelected: NOT_SUPPORT,
  blockClient: createClient('https://aurora-graph.kyberengineering.io/subgraphs/name/kybernetwork/aurora-blocks'),
  etherscanUrl: 'https://aurorascan.dev',
  etherscanName: 'Aurora Explorer',
  tokenListUrl: `${KS_SETTING_API}/v1/tokens?chainIds=${ChainId.AURORA}&isWhitelisted=${true}`,
  bridgeURL: EMPTY,
  nativeToken: {
    symbol: 'ETH',
    name: 'ETH',
    logo: EthereumLogo,
    decimal: 18,
    minForGas: 10 ** 16,
  },
  rpcUrl: 'https://aurora.kyberengineering.io',
  routerUri: `${AGGREGATOR_API}/aurora/route/encode`,
  multicall: '0xBF69a56D35B8d6f5A8e0e96B245a72F735751e54',
  classic: {
    client: createClient('https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-exchange-aurora'),
    static: {
      zap: '0x2abE8750e4a65584d7452316356128C936273e0D',
      router: '0x5649B4DD00780e99Bab7Abb4A3d581Ea1aEB23D0',
      factory: '0x1c758aF0688502e49140230F6b0EBd376d429be5',
    },
    oldStatic: {
      zap: '0xd1f345593cb69fa546852b2DEb90f373F8AdC903',
      router: '0x0622973c3A8893838A3bc0c5309a8c6897148795',
      factory: '0x39a8809fBbF22cCaeAc450EaF559C076843eB910',
    },
    dynamic: NOT_SUPPORT,
    claimReward: NOT_SUPPORT,
    fairlaunch: EMPTY_ARRAY,
    fairlaunchV2: EMPTY_ARRAY,
  },
  elastic: {
    // Aurora not supports elastic
    client: createClient('https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-aurora'),
    startBlock: 0,
    coreFactory: '0x5F1dddbf348aC2fbe22a163e30F99F9ECE3DD50a',
    nonfungiblePositionManager: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
    tickReader: '0x165c68077ac06c83800d19200e6E2B08D02dE75D',
    initCodeHash: '0xc597aba1bb02db42ba24a8878837965718c032f8b46be94a6e46452a9f89ca01',
    quoter: '0x0D125c15D54cA1F8a813C74A81aEe34ebB508C1f',
    routers: '0xC1e7dFE73E1598E3910EF4C7845B68A9Ab6F4c83',
    farms: [],
  },
  limitOrder: {
    production: NOT_SUPPORT,
    development: NOT_SUPPORT,
  },
  averageBlockTimeInSeconds: 1,
  coingeckoNetworkId: 'aurora',
  coingeckoNativeTokenId: 'ethereum',
  deBankSlug: 'aurora',
  trueSightId: NOT_SUPPORT,
  dexToCompare: 'trisolaris',
}

export default auroraInfo

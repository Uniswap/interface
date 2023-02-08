import { ChainId } from '@kyberswap/ks-sdk-core'

import EthereumLogo from 'assets/images/ethereum-logo.png'
import OPTIMISM from 'assets/networks/optimism-network.svg'
import { AGGREGATOR_API, KS_SETTING_API } from 'constants/env'
import { EVMNetworkInfo } from 'constants/networks/type'
import { createClient } from 'utils/client'

const EMPTY = ''
const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const optimismInfo: EVMNetworkInfo = {
  chainId: ChainId.OPTIMISM,
  route: 'optimism',
  ksSettingRoute: 'optimism',
  priceRoute: 'optimism',
  poolFarmRoute: 'optimism',
  name: 'Optimism',
  icon: OPTIMISM,
  iconDark: NOT_SUPPORT,
  iconSelected: NOT_SUPPORT,
  iconDarkSelected: NOT_SUPPORT,
  blockClient: createClient('https://api.thegraph.com/subgraphs/name/ianlapham/uni-testing-subgraph'),
  etherscanUrl: 'https://optimistic.etherscan.io',
  etherscanName: 'Optimistic Ethereum Explorer',
  tokenListUrl: `${KS_SETTING_API}/v1/tokens?chainIds=${ChainId.OPTIMISM}&isWhitelisted=${true}`,
  bridgeURL: EMPTY,
  nativeToken: {
    symbol: 'ETH',
    name: 'ETH',
    logo: EthereumLogo,
    decimal: 18,
    minForGas: 10 ** 16,
  },
  rpcUrl: 'https://opt-mainnet.g.alchemy.com/v2/N7gZFcuMkhLTTpdsRLEcDXYIJssj6GsI',
  routerUri: `${AGGREGATOR_API}/optimism/route/encode`,
  multicall: '0xD9bfE9979e9CA4b2fe84bA5d4Cf963bBcB376974',
  classic: {
    client: createClient('https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-exchange-optimism'),
    static: {
      zap: '0x2abE8750e4a65584d7452316356128C936273e0D',
      router: '0x5649B4DD00780e99Bab7Abb4A3d581Ea1aEB23D0',
      factory: '0x1c758aF0688502e49140230F6b0EBd376d429be5',
    },
    oldStatic: NOT_SUPPORT,
    dynamic: NOT_SUPPORT,
    claimReward: NOT_SUPPORT,
    fairlaunch: EMPTY_ARRAY,
    fairlaunchV2: ['0x715Cc6C0d591CA3FA8EA6e4Cb445adA0DC79069A'],
  },
  elastic: {
    client: createClient('https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-optimism'),
    startBlock: 12001267,
    coreFactory: '0x5F1dddbf348aC2fbe22a163e30F99F9ECE3DD50a',
    nonfungiblePositionManager: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
    tickReader: '0x165c68077ac06c83800d19200e6E2B08D02dE75D',
    initCodeHash: '0xc597aba1bb02db42ba24a8878837965718c032f8b46be94a6e46452a9f89ca01',
    quoter: '0x0D125c15D54cA1F8a813C74A81aEe34ebB508C1f',
    routers: '0xC1e7dFE73E1598E3910EF4C7845B68A9Ab6F4c83',
    farms: ['0xb85ebE2e4eA27526f817FF33fb55fB240057C03F'],
  },
  limitOrder: {
    development: '0xAF800D3EB207BAFBadE540554DF8bDCe561166f8',
    production: '0x227B0c196eA8db17A665EA6824D972A64202E936',
  },
  averageBlockTimeInSeconds: 120,
  coingeckoNetworkId: 'optimistic-ethereum',
  coingeckoNativeTokenId: 'ethereum',
  deBankSlug: 'op',
  trueSightId: NOT_SUPPORT,
  dexToCompare: 'uniswapv3',
}

export default optimismInfo

import { ChainId } from '@kyberswap/ks-sdk-core'

import CRONOS_DARK from 'assets/networks/cronos-network-dark.svg'
import CRONOS from 'assets/networks/cronos-network.svg'
import CronosLogo from 'assets/svg/cronos-token-logo.svg'
import { AGGREGATOR_API, KS_SETTING_API } from 'constants/env'
import { EVMNetworkInfo } from 'constants/networks/type'
import { createClient } from 'utils/client'

const EMPTY = ''
const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const cronosInfo: EVMNetworkInfo = {
  chainId: ChainId.CRONOS,
  route: 'cronos',
  ksSettingRoute: 'cronos',
  priceRoute: 'cronos',
  poolFarmRoute: 'cronos',
  name: 'Cronos',
  icon: CRONOS,
  iconDark: CRONOS_DARK,
  iconDarkSelected: CRONOS,
  iconSelected: CRONOS,
  blockClient: createClient('https://cronos-graph.kyberengineering.io/subgraphs/name/kybernetwork/cronos-blocks'),
  etherscanUrl: 'https://cronoscan.com',
  etherscanName: 'Cronos explorer',
  tokenListUrl: `${KS_SETTING_API}/v1/tokens?chainIds=${ChainId.CRONOS}&isWhitelisted=${true}`,
  bridgeURL: EMPTY,
  nativeToken: {
    symbol: 'CRO',
    name: 'CRO',
    logo: CronosLogo,
    decimal: 18,
    minForGas: 10 ** 16,
  },
  rpcUrl: 'https://evm-cronos.crypto.org',
  routerUri: `${AGGREGATOR_API}/cronos/route/encode`,
  multicall: '0x63Abb9973506189dC3741f61d25d4ed508151E6d',
  classic: {
    client: createClient(
      'https://cronos-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-exchange-cronos',
    ),
    static: {
      zap: '0x2abE8750e4a65584d7452316356128C936273e0D',
      router: '0x5649B4DD00780e99Bab7Abb4A3d581Ea1aEB23D0',
      factory: '0x1c758aF0688502e49140230F6b0EBd376d429be5',
    },
    oldStatic: NOT_SUPPORT,
    dynamic: {
      zap: '0x83D4908c1B4F9Ca423BEE264163BC1d50F251c31',
      router: '0xEaE47c5D99f7B31165a7f0c5f7E0D6afA25CFd55',
      factory: '0xD9bfE9979e9CA4b2fe84bA5d4Cf963bBcB376974',
    },
    claimReward: NOT_SUPPORT,
    fairlaunch: EMPTY_ARRAY,
    fairlaunchV2: EMPTY_ARRAY,
  },
  elastic: {
    client: createClient(
      'https://cronos-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-cronos',
    ),
    startBlock: 3152290,
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
  averageBlockTimeInSeconds: 6,
  coingeckoNetworkId: 'cronos',
  coingeckoNativeTokenId: 'crypto-com-chain',
  deBankSlug: 'cro',
  trueSightId: 'cronos',
  dexToCompare: 'vvs',
}

export default cronosInfo

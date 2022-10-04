import { ChainId } from '@kyberswap/ks-sdk-core'

import Mainnet from 'assets/networks/ethw.png'
import { createClient } from 'utils/client'

import { NetworkInfo } from '../type'

const EMPTY = ''
const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const ethereumInfo: NetworkInfo = {
  chainId: ChainId.ETHW,
  route: 'ethw',
  name: 'EthereumPoW',
  icon: Mainnet,
  classicClient: createClient(
    'https://ethereum-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-exchange-ethereum',
  ),
  elasticClient: createClient(
    'https://ethereum-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-ethereum',
  ),
  blockClient: createClient('https://ethereum-graph.kyberengineering.io/subgraphs/name/kybernetwork/ethereum-blocks'),
  etherscanUrl: 'https://www.oklink.com/en/ethw',
  etherscanName: 'Ethwscan',
  tokenListUrl: `${process.env.REACT_APP_KS_SETTING_API}/v1/tokens?chainIds=${
    ChainId.ETHW
  }&pageSize=${100}&isWhitelisted=${true}`,
  bridgeURL: EMPTY,
  nativeToken: {
    symbol: 'ETHW',
    name: 'ETHW (Wrapped)',
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    logo: Mainnet,
    decimal: 18,
  },
  rpcUrl: 'https://ethereumpow.kyberengineering.io',
  routerUri: `${process.env.REACT_APP_AGGREGATOR_API}/ethw/route/encode`,
  classic: {
    static: {
      zap: '0x2abE8750e4a65584d7452316356128C936273e0D',
      router: '0x5649B4DD00780e99Bab7Abb4A3d581Ea1aEB23D0',
      factory: '0x1c758aF0688502e49140230F6b0EBd376d429be5',
    },
    oldStatic: NOT_SUPPORT,
    dynamic: {
      zap: '0x83D4908c1B4F9Ca423BEE264163BC1d50F251c31',
      router: '0x1c87257F5e8609940Bc751a07BB085Bb7f8cDBE6',
      factory: '0x833e4083B7ae46CeA85695c4f7ed25CDAd8886dE',
    },
    claimReward: EMPTY,
    fairlaunch: EMPTY_ARRAY,
    fairlaunchV2: EMPTY_ARRAY,
  },
  elastic: {
    coreFactory: '0x5F1dddbf348aC2fbe22a163e30F99F9ECE3DD50a',
    nonfungiblePositionManager: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
    tickReader: '0x165c68077ac06c83800d19200e6E2B08D02dE75D',
    initCodeHash: '0xc597aba1bb02db42ba24a8878837965718c032f8b46be94a6e46452a9f89ca01',
    quoter: '0x0D125c15D54cA1F8a813C74A81aEe34ebB508C1f',
    routers: '0xC1e7dFE73E1598E3910EF4C7845B68A9Ab6F4c83',
  },
  averageBlockTimeInSeconds: 13.13,
  coingeckoNetworkId: '',
  coingeckoNativeTokenId: '',
  deBankSlug: '',
}

export default ethereumInfo

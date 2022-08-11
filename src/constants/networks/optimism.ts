import { ChainId } from '@kyberswap/ks-sdk-core'

import EthereumLogo from 'assets/images/ethereum-logo.png'
import OPTIMISM from 'assets/networks/optimism-network.svg'
import { createClient } from 'utils/client'

import { NetworkInfo } from '../type'

const EMPTY = ''
const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const optimismInfo: NetworkInfo = {
  chainId: ChainId.OPTIMISM,
  route: 'optimism',
  name: 'Optimism',
  icon: OPTIMISM,
  classicClient: createClient('https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-exchange-optimism'),
  elasticClient: createClient('https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-optimism'),
  blockClient: createClient('https://api.thegraph.com/subgraphs/name/ianlapham/uni-testing-subgraph'),
  etherscanUrl: 'https://optimistic.etherscan.io',
  etherscanName: 'Optimistic Ethereum Explorer',
  tokenListUrl: `${process.env.REACT_APP_TOKEN_LIST_API}?chainId=${ChainId.OPTIMISM}`,
  bridgeURL: 'https://app.optimism.io/bridge',
  nativeToken: {
    symbol: 'ETH',
    name: 'ETH (Wrapped)',
    address: '0x4200000000000000000000000000000000000006',
    logo: EthereumLogo,
    decimal: 18,
  },
  rpcUrl: 'https://mainnet.optimism.io',
  routerUri: `${process.env.REACT_APP_AGGREGATOR_API}/optimism/route/encode`,
  classic: {
    static: {
      zap: '0x2abE8750e4a65584d7452316356128C936273e0D',
      router: '0x5649B4DD00780e99Bab7Abb4A3d581Ea1aEB23D0',
      factory: '0x1c758aF0688502e49140230F6b0EBd376d429be5',
    },
    oldStatic: NOT_SUPPORT,
    dynamic: NOT_SUPPORT,
    routerV2: '0x00555513Acf282B42882420E5e5bA87b44D8fA6E',
    aggregationExecutor: '0x41684b361557E9282E0373CA51260D9331e518C9',
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
  averageBlockTimeInSeconds: 120,
  coingeckoNetworkId: 'optimistic-ethereum',
  coingeckoNativeTokenId: 'ethereum',
  deBankSlug: 'op',
}

export default optimismInfo

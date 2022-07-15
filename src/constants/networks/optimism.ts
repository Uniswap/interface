import { ChainId } from '@kyberswap/ks-sdk-core'
import { NetworkInfo } from '../type'
import { createClient } from 'utils/client'

import OPTIMISM from 'assets/networks/optimism-network.svg'
import EthereumLogo from 'assets/images/ethereum-logo.png'

const EMPTY = ''
const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const optimismInfo: NetworkInfo = {
  //todo namgold: fill this
  chainId: ChainId.OPTIMISM,
  route: 'optimism',
  name: 'Optimism',
  icon: OPTIMISM,
  classicClient: createClient('https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-exchange-optimism'),
  elasticClient: createClient('https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-optimism'),
  blockClient: createClient('https://api.thegraph.com/subgraphs/name/ianlapham/uni-testing-subgraph'),
  etherscanUrl: 'https://optimistic.etherscan.io',
  etherscanName: 'Optimistic Ethereum Explorer',
  tokenListUrl: 'https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/tokenLists/optimism.tokenlist.json',
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
    tickReader: '0xdC4382353A007fCefADF0609920C256173F7d210',
    initCodeHash: '0xc597aba1bb02db42ba24a8878837965718c032f8b46be94a6e46452a9f89ca01',
    quoter: '0x0D125c15D54cA1F8a813C74A81aEe34ebB508C1f',
    routers: '0xC1e7dFE73E1598E3910EF4C7845B68A9Ab6F4c83',
  },
  averageBlockTimeInSeconds: 120,
  coingeckoNetworkId: 'optimistic-ethereum',
  coingeckoNativeTokenId: 'ethereum',
}

export default optimismInfo

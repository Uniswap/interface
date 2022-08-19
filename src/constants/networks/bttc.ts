import { ChainId } from '@kyberswap/ks-sdk-core'

import BTT from 'assets/networks/bttc.png'
import { createClient } from 'utils/client'

import { NetworkInfo } from '../type'

const EMPTY = ''
const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const bttcInfo: NetworkInfo = {
  chainId: ChainId.BTTC,
  route: 'bittorrent',
  name: 'BitTorrent',
  icon: BTT,
  classicClient: createClient(
    'https://bttc-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-exchange-bttc',
  ),
  elasticClient: createClient(
    'https://bttc-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-bttc',
  ),
  blockClient: createClient('https://bttc-graph.kyberengineering.io/subgraphs/name/kybernetwork/bttc-blocks'),
  etherscanUrl: 'https://bttcscan.com',
  etherscanName: 'Bttcscan',
  tokenListUrl: `${process.env.REACT_APP_TOKEN_LIST_API}?chainId=${ChainId.BTTC}`,
  bridgeURL: 'https://wallet.bt.io/bridge',
  nativeToken: {
    symbol: 'BTT',
    name: 'BTT (Wrapped)',
    address: '0x8D193c6efa90BCFf940A98785d1Ce9D093d3DC8A',
    logo: BTT,
    decimal: 18,
  },
  rpcUrl: 'https://bttc.kyberengineering.io',
  routerUri: `${process.env.REACT_APP_AGGREGATOR_API}/bttc/route/encode`,
  classic: {
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
    claimReward: '0x1a91f5ADc7cB5763d35A26e98A18520CB9b67e70',
    fairlaunch: EMPTY_ARRAY,
    fairlaunchV2: [
      '0x8e9Bd30D15420bAe4B7EC0aC014B7ECeE864373C',
      '0xa107e6466Be74361840059a11e390200371a7538',
      '0x89929Bc485cE72D2Af7b7283B40b921e9F4f80b3',
    ],
  },
  elastic: {
    coreFactory: '0x5F1dddbf348aC2fbe22a163e30F99F9ECE3DD50a',
    nonfungiblePositionManager: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
    tickReader: '0x165c68077ac06c83800d19200e6E2B08D02dE75D',
    initCodeHash: '0xc597aba1bb02db42ba24a8878837965718c032f8b46be94a6e46452a9f89ca01',
    quoter: '0x0D125c15D54cA1F8a813C74A81aEe34ebB508C1f',
    routers: '0xC1e7dFE73E1598E3910EF4C7845B68A9Ab6F4c83',
  },
  averageBlockTimeInSeconds: 2, // TODO: check these info
  coingeckoNetworkId: 'tron',
  coingeckoNativeTokenId: 'bittorrent',
  deBankSlug: EMPTY,
}

export default bttcInfo

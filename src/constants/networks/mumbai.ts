import { ChainId } from '@kyberswap/ks-sdk-core'

import Polygon from 'assets/networks/polygon-network.png'
import { createClient } from 'utils/client'

import { NetworkInfo } from '../type'

const EMPTY = ''
const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const mumbaiInfo: NetworkInfo = {
  chainId: ChainId.MUMBAI,
  route: 'mumbai',
  name: 'Mumbai',
  icon: Polygon,
  classicClient: createClient('https://api.thegraph.com/subgraphs/name/piavgh/dmm-exchange-mumbai'),
  elasticClient: createClient('https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-matic'), //todo: not exits yet
  blockClient: createClient('https://api.thegraph.com/subgraphs/name/piavgh/mumbai-blocks'),
  etherscanUrl: 'https://mumbai.polygonscan.com/',
  etherscanName: 'Polygonscan',
  tokenListUrl: `${process.env.REACT_APP_KS_SETTING_API}/v1/tokens?chainId=${ChainId.MUMBAI}`,
  bridgeURL: 'https://wallet.matic.network/bridge',
  nativeToken: {
    symbol: 'MATIC',
    name: 'MATIC (Wrapped)',
    address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    logo: Polygon,
    decimal: 18,
  },
  rpcUrl: 'https://rpc-mumbai.maticvigil.com',
  routerUri: EMPTY,
  classic: {
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
    claimReward: EMPTY,
    fairlaunch: ['0x882233B197F9e50b1d41F510fD803a510470d7a6'],
    fairlaunchV2: EMPTY_ARRAY,
  },
  elastic: {
    coreFactory: '0x5F1dddbf348aC2fbe22a163e30F99F9ECE3DD50a',
    nonfungiblePositionManager: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
    tickReader: '0xe3AC3fd66EB31cAf4EE0831b262D837c479FFCe5',
    initCodeHash: '0xc597aba1bb02db42ba24a8878837965718c032f8b46be94a6e46452a9f89ca01',
    quoter: '0x0D125c15D54cA1F8a813C74A81aEe34ebB508C1f',
    routers: '0xC1e7dFE73E1598E3910EF4C7845B68A9Ab6F4c83',
  },
  averageBlockTimeInSeconds: 2.6,
  coingeckoNetworkId: EMPTY,
  coingeckoNativeTokenId: EMPTY,
  deBankSlug: EMPTY,
}

export default mumbaiInfo

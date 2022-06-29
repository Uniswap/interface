import { ChainId } from '@kyberswap/ks-sdk-core'
import { NetworkInfo } from '../type'
import { createClient } from 'utils/client'

import Mainnet from 'assets/networks/mainnet-network.svg'
import EthereumLogo from 'assets/images/ethereum-logo.png'

const EMPTY = ''
const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const kovanInfo: NetworkInfo = {
  chainId: ChainId.KOVAN,
  route: 'kovan',
  name: 'Kovan',
  icon: Mainnet,
  classicClient: createClient('https://api.thegraph.com/subgraphs/name/nguyenhuudungz/dmm-exchange-ropsten'), //todo: not exits yet
  elasticClient: createClient('https://api.thegraph.com/subgraphs/name/viet-nv/promm-rinkeby'), //todo: not exits yet
  blockClient: createClient('https://api.thegraph.com/subgraphs/name/edwardevans094/ropsten-blocks'), //todo: not exits yet
  etherscanUrl: 'https://kovan.etherscan.io',
  etherscanName: 'Kovan Explorer',
  tokenListUrl: 'https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/tokenLists/ropsten.tokenlist.json',
  bridgeURL: EMPTY,
  nativeToken: {
    symbol: 'ETH',
    name: 'ETH (Wrapped)',
    address: '0xc778417E063141139Fce010982780140Aa0cD5Ab',
    logo: EthereumLogo,
    decimal: 18,
  },
  rpcUrl: 'https://kovan.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  routerUri: EMPTY,
  classic: {
    static: {
      zap: EMPTY,
      router: EMPTY,
      factory: EMPTY,
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
    tickReader: '0xe3AC3fd66EB31cAf4EE0831b262D837c479FFCe5',
    initCodeHash: '0xc597aba1bb02db42ba24a8878837965718c032f8b46be94a6e46452a9f89ca01',
    quoter: '0x0D125c15D54cA1F8a813C74A81aEe34ebB508C1f',
    routers: '0xC1e7dFE73E1598E3910EF4C7845B68A9Ab6F4c83',
  },
  avgrageBlockTimeInSeconds: 13.13,
  coingeckoNetworkId: EMPTY,
  coingeckoNativeTokenId: EMPTY,
}

export default kovanInfo

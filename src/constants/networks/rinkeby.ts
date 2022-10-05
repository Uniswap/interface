import { ChainId } from '@kyberswap/ks-sdk-core'

import EthereumLogo from 'assets/images/ethereum-logo.png'
import Mainnet from 'assets/networks/mainnet-network.svg'
import { KS_SETTING_API } from 'constants/env'
import { createClient } from 'utils/client'

import { NetworkInfo } from '../type'

const EMPTY = ''
const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const rinkebyInfo: NetworkInfo = {
  chainId: ChainId.RINKEBY,
  route: 'rinkeby',
  name: 'Rinkeby',
  icon: Mainnet,
  classicClient: createClient('https://api.thegraph.com/subgraphs/name/nguyenhuudungz/dmm-exchange-ropsten'), //todo: not exits yet
  elasticClient: createClient('https://api.thegraph.com/subgraphs/name/viet-nv/promm-rinkeby'),
  blockClient: createClient('https://api.thegraph.com/subgraphs/name/billjhlee/rinkeby-blocks'),
  etherscanUrl: 'https://rinkeby.etherscan.io',
  etherscanName: 'Rinkeby Explorer',
  tokenListUrl: `${KS_SETTING_API}/v1/tokens?chainIds=${ChainId.RINKEBY}&isWhitelisted=${true}`,
  bridgeURL: EMPTY,
  nativeToken: {
    symbol: 'ETH',
    name: 'ETH (Wrapped)',
    address: '0xc778417E063141139Fce010982780140Aa0cD5Ab',
    logo: EthereumLogo,
    decimal: 18,
  },
  rpcUrl: 'https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  routerUri: 'https://aggregator-api.dev.kyberengineering.io/rinkeby/route/encode',
  classic: {
    static: {
      zap: EMPTY,
      router: '0x89F138263B698D0708689e0aD10dC0E65C2B02BB',
      factory: '0x1811E801C09CCDa73b50fB3493254d05e9aE641F',
    },
    oldStatic: NOT_SUPPORT,
    dynamic: {
      zap: EMPTY,
      router: EMPTY,
      factory: EMPTY,
    },
    claimReward: EMPTY,
    fairlaunch: EMPTY_ARRAY,
    fairlaunchV2: EMPTY_ARRAY,
  },
  elastic: {
    coreFactory: '0xBC1A68889EB9DE88838259B16d30C3639304A546',
    nonfungiblePositionManager: '0x50067B85491Fd7f3E3a5e707a9161F1f4f68372e',
    tickReader: '0x8F30cd9943C289B3BcFAB000998b6719F1cFf63a',
    initCodeHash: '0x9af381b43515b80cfc9d1c3abe15a1ebd48392d5df2bcce1eb4940eea548c789',
    quoter: '0x5BcbB0bb7236d9fb3DB4C996B05f0e6162Ba5B64',
    routers: '0x335cB9b399e3c33c4a0d1bE7407675C888f66e86',
  },
  averageBlockTimeInSeconds: 13.13,
  coingeckoNetworkId: EMPTY,
  coingeckoNativeTokenId: EMPTY,
  deBankSlug: EMPTY,
}

export default rinkebyInfo

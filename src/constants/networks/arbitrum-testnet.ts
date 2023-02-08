import { ChainId } from '@kyberswap/ks-sdk-core'

import EthereumLogo from 'assets/images/ethereum-logo.png'
import ARBITRUM from 'assets/networks/arbitrum-network.svg'
import { KS_SETTING_API } from 'constants/env'
import { EVMNetworkInfo } from 'constants/networks/type'
import { createClient } from 'utils/client'

const EMPTY = ''
const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const arbitrumTestnetInfo: EVMNetworkInfo = {
  chainId: ChainId.ARBITRUM_TESTNET,
  route: 'arbitrum-testnet',
  ksSettingRoute: 'arbitrum',
  priceRoute: 'arbitrum',
  poolFarmRoute: EMPTY,
  name: 'Arbitrum Testnet',
  icon: ARBITRUM,
  iconDark: NOT_SUPPORT,
  iconSelected: NOT_SUPPORT,
  iconDarkSelected: NOT_SUPPORT,
  blockClient: createClient('https://api.thegraph.com/subgraphs/name/viet-nv/arbitrum-rinkeby-blocks'),
  etherscanUrl: 'https://testnet.arbiscan.io',
  etherscanName: 'Arbiscan',
  tokenListUrl: `${KS_SETTING_API}/v1/tokens?chainIds=${ChainId.ARBITRUM_TESTNET}&isWhitelisted=${true}`,
  bridgeURL: EMPTY,
  nativeToken: {
    symbol: 'ETH',
    name: 'ETH',
    logo: EthereumLogo,
    decimal: 18,
    minForGas: 10 ** 16,
  },
  rpcUrl: 'https://rinkeby.arbitrum.io/rpc',
  routerUri: EMPTY,
  multicall: '0xefEb0223C51600d8059A4fD44094a1E2A2C54Bf7',
  classic: {
    client: createClient('https://api.thegraph.com/subgraphs/name/viet-nv/kyberswap-arbitrum-rinkeby'),
    static: {
      zap: '0xfa33723F6fA00a35F69F8aCd72A5BE9AF3c8Bd25',
      router: '0x78Ad9A49327D73C6E3B9881eCD653232cF3E480C',
      factory: '0x9D4ffbf49cc21372c2115Ae4C155a1e5c0aACf36',
    },
    oldStatic: NOT_SUPPORT,
    dynamic: NOT_SUPPORT,
    claimReward: NOT_SUPPORT,
    fairlaunch: EMPTY_ARRAY,
    fairlaunchV2: EMPTY_ARRAY,
  },
  elastic: {
    client: createClient('https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-arbitrum-one'),
    startBlock: 14137735,
    coreFactory: '0x5F1dddbf348aC2fbe22a163e30F99F9ECE3DD50a',
    nonfungiblePositionManager: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
    tickReader: '0xe3AC3fd66EB31cAf4EE0831b262D837c479FFCe5',
    initCodeHash: '0xc597aba1bb02db42ba24a8878837965718c032f8b46be94a6e46452a9f89ca01',
    quoter: '0x0D125c15D54cA1F8a813C74A81aEe34ebB508C1f',
    routers: '0xC1e7dFE73E1598E3910EF4C7845B68A9Ab6F4c83',
    farms: [],
  },
  limitOrder: { development: NOT_SUPPORT, production: NOT_SUPPORT },
  averageBlockTimeInSeconds: 1, // TODO: check these info
  coingeckoNetworkId: NOT_SUPPORT,
  coingeckoNativeTokenId: 'ethereum',
  deBankSlug: EMPTY,
  trueSightId: NOT_SUPPORT,
  dexToCompare: NOT_SUPPORT,
}

export default arbitrumTestnetInfo

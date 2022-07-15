import { ChainId } from '@kyberswap/ks-sdk-core'
import { NetworkInfo } from '../type'
import { createClient } from 'utils/client'

import AVAX from 'assets/networks/avax-network.png'

const EMPTY = ''
const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const avaxTestnetInfo: NetworkInfo = {
  chainId: ChainId.AVAXTESTNET,
  route: 'avalanche-testnet',
  name: 'Avalanche Testnet',
  icon: AVAX,
  classicClient: createClient('https://api.thegraph.com/subgraphs/name/ducquangkstn/dmm-exchange-fuij'),
  elasticClient: createClient('https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-avalanche'),
  blockClient: createClient('https://api.thegraph.com/subgraphs/name/ducquangkstn/ethereum-block-fuji'),
  etherscanUrl: 'https://testnet.snowtrace.io',
  etherscanName: 'Snowtrace',
  tokenListUrl: 'https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/tokenLists/avax.testnet.tokenlist.json',
  bridgeURL: 'https://bridge.avax.network',
  nativeToken: {
    symbol: 'AVAX',
    name: 'AVAX (Wrapped)',
    address: EMPTY,
    logo: AVAX,
    decimal: 18,
  },
  rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
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
      router: '0x19395624C030A11f58e820C3AeFb1f5960d9742a',
      factory: '0x7900309d0b1c8D3d665Ae40e712E8ba4FC4F5453',
    },
    routerV2: '0x00555513Acf282B42882420E5e5bA87b44D8fA6E',
    aggregationExecutor: '0x41684b361557E9282E0373CA51260D9331e518C9',
    claimReward: EMPTY,
    fairlaunch: ['0xC3E2aED41ECdFB1ad41ED20D45377Da98D5489dD'],
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
  averageBlockTimeInSeconds: 1.85,
  coingeckoNetworkId: EMPTY,
  coingeckoNativeTokenId: EMPTY,
}

export default avaxTestnetInfo

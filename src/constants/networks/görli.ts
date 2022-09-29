import { ChainId } from '@kyberswap/ks-sdk-core'

import EthereumLogo from 'assets/images/ethereum-logo.png'
import Mainnet from 'assets/networks/mainnet-network.svg'
import { createClient } from 'utils/client'

import { NetworkInfo } from '../type'

const EMPTY = ''
const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const görliInfo: NetworkInfo = {
  chainId: ChainId.GÖRLI,
  route: 'goerli',
  name: 'Görli',
  icon: Mainnet,
  classicClient: createClient(
    'https://ethereum-graph.dev.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-classic-goerli',
  ),
  elasticClient: createClient(
    'https://ethereum-graph.dev.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-goerli',
  ),
  blockClient: createClient('https://ethereum-graph.dev.kyberengineering.io/subgraphs/name/kybernetwork/goerli-blocks'),
  etherscanUrl: 'https://goerli.etherscan.io',
  etherscanName: 'Goerli Explorer',
  tokenListUrl: `${process.env.REACT_APP_KS_SETTING_API}/v1/tokens?chainIds=${
    ChainId.ROPSTEN
  }&pageSize=${100}&isWhitelisted=${true}`,
  bridgeURL: EMPTY,
  nativeToken: {
    symbol: 'ETH',
    name: 'ETH (Wrapped)',
    address: '0xc778417E063141139Fce010982780140Aa0cD5Ab',
    logo: EthereumLogo,
    decimal: 18,
  },
  rpcUrl: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  routerUri: EMPTY,
  classic: {
    static: {
      zap: EMPTY,
      router: '0x4F4994415B72FE87E01345f522D0A62A584D19b4',
      factory: '0xE612668FbE2CfDb71A4b6cD422d611E63585D33A',
    },
    oldStatic: NOT_SUPPORT,
    dynamic: NOT_SUPPORT,
    claimReward: EMPTY,
    fairlaunch: EMPTY_ARRAY,
    fairlaunchV2: EMPTY_ARRAY,
  },
  elastic: {
    coreFactory: '0x1a91f5ADc7cB5763d35A26e98A18520CB9b67e70',
    nonfungiblePositionManager: '0x8B76f8e008570686aD5933e5669045c5B01DB7bE',
    tickReader: '0x24F40B8a021d5442B97459A336D1363E4D0f1388',
    initCodeHash: '0xc597aba1bb02db42ba24a8878837965718c032f8b46be94a6e46452a9f89ca01',
    quoter: '0x032c677619f72c670e4DA64126B48d906dfa952F',
    routers: '0x45a5B8Cf524EC574b40e80274F0F3856A679C5c4',
  },
  averageBlockTimeInSeconds: 13.13,
  coingeckoNetworkId: EMPTY,
  coingeckoNativeTokenId: EMPTY,
  deBankSlug: EMPTY,
}

export default görliInfo

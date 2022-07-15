import { ChainId } from '@kyberswap/ks-sdk-core'
import { NetworkInfo } from '../type'
import { createClient } from 'utils/client'

import Mainnet from 'assets/networks/mainnet-network.svg'
import EthereumLogo from 'assets/images/ethereum-logo.png'

const EMPTY = ''
const NOT_SUPPORT = null

const ropstenInfo: NetworkInfo = {
  chainId: ChainId.ROPSTEN,
  route: 'ropsten',
  name: 'Ropsten',
  icon: Mainnet,
  classicClient: createClient('https://api.thegraph.com/subgraphs/name/viet-nv/kyberswap-classic-ropsten'),
  elasticClient: createClient('https://api.thegraph.com/subgraphs/name/viet-nv/promm-ropsten'),
  blockClient: createClient('https://api.thegraph.com/subgraphs/name/edwardevans094/ropsten-blocks'),
  etherscanUrl: 'https://ropsten.etherscan.io',
  etherscanName: 'Ropsten Explorer',
  tokenListUrl: 'https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/tokenLists/ropsten.tokenlist.json',
  bridgeURL: EMPTY,
  nativeToken: {
    symbol: 'ETH',
    name: 'ETH (Wrapped)',
    address: '0xc778417E063141139Fce010982780140Aa0cD5Ab',
    logo: EthereumLogo,
    decimal: 18,
  },
  rpcUrl: 'https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  routerUri: EMPTY,
  classic: {
    static: {
      zap: '0x548E585B17908D0387d16F9BFf46c4EDe7ca7746',
      router: '0x136ae5CC3150C4e53AF8b1DC886464CB9AF1AB61',
      factory: '0xB332f6145A5b064f58FF9793ba3523245F8fafaC',
    },
    oldStatic: NOT_SUPPORT,
    dynamic: {
      zap: '0xc33D1124c43cE3d020d1153fa0593eB9Ebc75Fb0',
      router: '0x96E8B9E051c81661C36a18dF64ba45F86AC80Aae',
      factory: '0x0639542a5cd99bd5f4e85f58cb1f61d8fbe32de9',
    },
    routerV2: '0x00555513Acf282B42882420E5e5bA87b44D8fA6E',
    aggregationExecutor: '0x41684b361557E9282E0373CA51260D9331e518C9',
    claimReward: '0xB2eA6DaAD5334907311c63a27EdFb02535048f50',
    fairlaunch: ['0x0FEEa33C4dE6f37A0Fc550028FddA2401B2Ee5Ce', '0xfEf235b06AFe69589e6C7622F4C071BcCed5bb13'],
    fairlaunchV2: [
      '0x26Eb52A419C5492134BB9007795CdACBa20143DE',
      '0xbc191D7757Be78FbE0997Ba59304A35cdE844dD8',
      '0xBDe20F598AEe01732Be0011E2D2210e10de4e49d',
    ],
  },
  elastic: {
    coreFactory: '0x7D877Cde00D6575bd45E15Af64BA193e32A09743',
    nonfungiblePositionManager: '0x593040768dAF97CEB9d2dBD627B00a209A5FE986',
    tickReader: '0x9A32cd0d2Fc6C60bFE51B0f0Ab27bAd82ca8F3FD',
    initCodeHash: '0xc597aba1bb02db42ba24a8878837965718c032f8b46be94a6e46452a9f89ca01',
    quoter: '0x7BA7cC55D3Ef5226b421bb3fD689251855B4cd21',
    routers: '0x1A46dCaC1d91F1731574BEfAEDaC4E0392726e35',
  },
  averageBlockTimeInSeconds: 13.13,
  coingeckoNetworkId: EMPTY,
  coingeckoNativeTokenId: EMPTY,
}

export default ropstenInfo

import { ChainId } from '@kyberswap/ks-sdk-core'

import BnbLogo from 'assets/images/bnb-logo.png'
import BSC from 'assets/networks/bsc-network.png'
import { KS_SETTING_API } from 'constants/env'
import { createClient } from 'utils/client'

import { NetworkInfo } from '../type'

const EMPTY = ''
const NOT_SUPPORT = null

const bnbInfo: NetworkInfo = {
  chainId: ChainId.BSCMAINNET,
  route: 'bnb',
  name: 'BNB Chain',
  icon: BSC,
  classicClient: createClient('https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-exchange-bsc'),
  elasticClient: createClient('https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-bsc'),
  blockClient: createClient('https://api.thegraph.com/subgraphs/name/dynamic-amm/ethereum-blocks-bsc'),
  etherscanUrl: 'https://bscscan.com',
  etherscanName: 'BscScan',
  tokenListUrl: `${KS_SETTING_API}/v1/tokens?chainIds=${ChainId.BSCMAINNET}&isWhitelisted=${true}`,
  bridgeURL: 'https://www.binance.org/en/bridge',
  nativeToken: {
    symbol: 'BNB',
    name: 'BNB (Wrapped)',
    address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    logo: BnbLogo,
    decimal: 18,
  },
  rpcUrl: 'https://bsc.kyberengineering.io',
  routerUri: `${process.env.REACT_APP_AGGREGATOR_API}/bsc/route/encode`,
  classic: {
    static: {
      zap: '0x2abE8750e4a65584d7452316356128C936273e0D',
      router: '0x5649B4DD00780e99Bab7Abb4A3d581Ea1aEB23D0',
      factory: '0x1c758aF0688502e49140230F6b0EBd376d429be5',
    },
    oldStatic: NOT_SUPPORT,
    dynamic: {
      zap: '0x83D4908c1B4F9Ca423BEE264163BC1d50F251c31',
      router: '0x78df70615ffc8066cc0887917f2Cd72092C86409',
      factory: '0x878dFE971d44e9122048308301F540910Bbd934c',
    },
    claimReward: EMPTY,
    fairlaunch: [
      '0x597e3FeDBC02579232799Ecd4B7edeC4827B0435',
      '0x3D88bDa6ed7dA31E15E86A41CA015Ea50771448E',
      '0x829c27fd3013b944cbE76E92c3D6c45767c0C789',
      '0xc49b3b43565b76E5ba7A98613263E7bFdEf1140c',
      '0xcCAc8DFb75120140A5469282a13E9A60B1751276',
      '0x31De05f28568e3d3D612BFA6A78B356676367470',
    ],
    fairlaunchV2: ['0x3474b537da4358A08f916b1587dccdD9585376A4'],
  },
  elastic: {
    coreFactory: '0x5F1dddbf348aC2fbe22a163e30F99F9ECE3DD50a',
    nonfungiblePositionManager: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
    tickReader: '0x165c68077ac06c83800d19200e6E2B08D02dE75D',
    initCodeHash: '0xc597aba1bb02db42ba24a8878837965718c032f8b46be94a6e46452a9f89ca01',
    quoter: '0x0D125c15D54cA1F8a813C74A81aEe34ebB508C1f',
    routers: '0xC1e7dFE73E1598E3910EF4C7845B68A9Ab6F4c83',
  },
  averageBlockTimeInSeconds: 3,
  coingeckoNetworkId: 'binance-smart-chain',
  coingeckoNativeTokenId: 'binancecoin',
  deBankSlug: 'bsc',
}

export default bnbInfo

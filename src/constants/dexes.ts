import { ChainId } from '@kyberswap/ks-sdk-core'

export const DEX_TO_COMPARE: { [chainId in ChainId]?: string } = {
  [ChainId.BSCMAINNET]: 'pancake',
  [ChainId.MATIC]: 'quickswap',
  [ChainId.AVAXMAINNET]: 'traderjoe',
  [ChainId.MAINNET]: 'uniswapv3',
  [ChainId.FANTOM]: 'spookyswap',
  [ChainId.CRONOS]: 'vvs',
  [ChainId.AURORA]: 'trisolaris',
  [ChainId.ARBITRUM]: 'sushiswap',
  [ChainId.VELAS]: 'wagyuswap',
  [ChainId.OASIS]: 'valleyswap-v2',
  [ChainId.OPTIMISM]: 'uniswapv3',
}

export const kyberswapDexes = [
  {
    name: 'KyberSwap Elastic',
    id: 'kyberswapv2',
    logoURL: 'https://kyberswap.com/favicon.ico',
  },
  {
    name: 'KyberSwap Classic',
    id: 'kyberswapv1',
    logoURL: 'https://kyberswap.com/favicon.ico',
  },
]

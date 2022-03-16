import { ChainId } from '@dynamic-amm/sdk'

interface Reward {
  symbol: string
  logo: string
}

export interface UpcomingPool {
  poolToken1Symbol: string
  poolToken1Logo: string
  poolToken2Symbol: string
  poolToken2Logo: string
  startingIn?: string
  network: ChainId
  rewards: Reward[]
  information: string
}

export const UPCOMING_POOLS: UpcomingPool[] = [
  {
    poolToken1Symbol: 'USDC.e',
    poolToken1Logo: 'https://raw.githubusercontent.com/ava-labs/avalanche-bridge-resources/main/tokens/USDC/logo.png',
    poolToken2Symbol: 'USDC',
    poolToken2Logo: 'https://raw.githubusercontent.com/ava-labs/avalanche-bridge-resources/main/tokens/USDC/logo.png',
    startingIn: '',
    network: ChainId.AVAXMAINNET,
    rewards: [
      {
        symbol: 'KNC',
        logo: 'https://raw.githubusercontent.com/dynamic-amm/dmm-interface/develop/src/assets/images/KNC.svg',
      },
      {
        symbol: 'AVAX',
        logo: 'https://raw.githubusercontent.com/dynamic-amm/dmm-interface/main/src/assets/networks/avax-network.png',
      },
    ],
    information: '',
  },

  {
    poolToken1Symbol: 'USDT.e',
    poolToken1Logo: 'https://raw.githubusercontent.com/ava-labs/avalanche-bridge-resources/main/tokens/USDT/logo.png',
    poolToken2Symbol: 'USDT',
    poolToken2Logo: 'https://raw.githubusercontent.com/ava-labs/avalanche-bridge-resources/main/tokens/USDT/logo.png',
    startingIn: '',
    network: ChainId.AVAXMAINNET,
    rewards: [
      {
        symbol: 'KNC',
        logo: 'https://raw.githubusercontent.com/dynamic-amm/dmm-interface/develop/src/assets/images/KNC.svg',
      },
      {
        symbol: 'AVAX',
        logo: 'https://raw.githubusercontent.com/dynamic-amm/dmm-interface/main/src/assets/networks/avax-network.png',
      },
    ],
    information: '',
  },

  {
    poolToken1Symbol: 'WETH.e',
    poolToken1Logo: 'https://raw.githubusercontent.com/ava-labs/avalanche-bridge-resources/main/tokens/WETH/logo.png',
    poolToken2Symbol: 'WAVAX',
    poolToken2Logo:
      'https://raw.githubusercontent.com/ava-labs/bridge-tokens/main/avalanche-tokens/0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7/logo.png',
    startingIn: '',
    network: ChainId.AVAXMAINNET,
    rewards: [
      {
        symbol: 'KNC',
        logo: 'https://raw.githubusercontent.com/dynamic-amm/dmm-interface/develop/src/assets/images/KNC.svg',
      },
      {
        symbol: 'AVAX',
        logo: 'https://raw.githubusercontent.com/dynamic-amm/dmm-interface/main/src/assets/networks/avax-network.png',
      },
    ],
    information: '',
  },

  {
    poolToken1Symbol: 'KNC',
    poolToken1Logo: 'https://raw.githubusercontent.com/dynamic-amm/dmm-interface/develop/src/assets/images/KNC.svg',
    poolToken2Symbol: 'WAVAX',
    poolToken2Logo:
      'https://raw.githubusercontent.com/ava-labs/bridge-tokens/main/avalanche-tokens/0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7/logo.png',
    startingIn: '',
    network: ChainId.AVAXMAINNET,
    rewards: [
      {
        symbol: 'KNC',
        logo: 'https://raw.githubusercontent.com/dynamic-amm/dmm-interface/develop/src/assets/images/KNC.svg',
      },
      {
        symbol: 'AVAX',
        logo: 'https://raw.githubusercontent.com/dynamic-amm/dmm-interface/main/src/assets/networks/avax-network.png',
      },
    ],
    information: '',
  },
]

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
    poolToken1Symbol: 'sAVAX',
    poolToken1Logo: 'https://i.imgur.com/lqxXmU7.png',
    poolToken2Symbol: 'AVAX',
    poolToken2Logo:
      'https://raw.githubusercontent.com/ava-labs/bridge-tokens/main/avalanche-tokens/0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7/logo.png',
    startingIn: 'Thursday, March 17, 2022 8:00:00 AM GMT+07:00',
    network: ChainId.AVAXMAINNET,
    rewards: [
      {
        symbol: 'QI',
        logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/9288.png',
      },
    ],
    information: '',
  },

  {
    poolToken1Symbol: 'sAVAX',
    poolToken1Logo: 'https://i.imgur.com/lqxXmU7.png',
    poolToken2Symbol: 'KNC',
    poolToken2Logo: 'https://raw.githubusercontent.com/dynamic-amm/dmm-interface/develop/src/assets/images/KNC.svg',
    startingIn: 'Thursday, March 17, 2022 8:00:00 AM GMT+07:00',
    network: ChainId.AVAXMAINNET,
    rewards: [
      {
        symbol: 'KNC',
        logo: 'https://raw.githubusercontent.com/dynamic-amm/dmm-interface/develop/src/assets/images/KNC.svg',
      },
    ],
    information: '',
  },

  {
    poolToken1Symbol: 'QI',
    poolToken1Logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/9288.png',
    poolToken2Symbol: 'KNC',
    poolToken2Logo:
      'https://raw.githubusercontent.com/ava-labs/bridge-tokens/main/avalanche-tokens/0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7/logo.png',
    startingIn: 'Thursday, March 17, 2022 8:00:00 AM GMT+07:00',
    network: ChainId.AVAXMAINNET,
    rewards: [
      {
        symbol: 'KNC',
        logo: 'https://raw.githubusercontent.com/dynamic-amm/dmm-interface/develop/src/assets/images/KNC.svg',
      },
    ],
    information: '',
  },
]

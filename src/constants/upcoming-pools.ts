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
    poolToken1Symbol: 'KNC.b',
    poolToken1Logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/9444.png',
    poolToken2Symbol: 'USDT.b',
    poolToken2Logo: 'https://coin.top/production/logo/usdtlogo.png',
    startingIn: 'Thursday, April 21, 2022 7:00:00 PM GMT+07:00',
    network: ChainId.BTTC,
    rewards: [
      {
        symbol: 'KNC',
        logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/9444.png',
      },
    ],
    information: '',
  },

  {
    poolToken1Symbol: 'KNC',
    poolToken1Logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/9444.png',
    poolToken2Symbol: 'ETH',
    poolToken2Logo:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/assets/0x2170Ed0880ac9A755fd29B2688956BD959F933F8/logo.png',
    startingIn: 'Thursday, April 21, 2022 7:00:00 PM GMT+07:00',
    network: ChainId.BTTC,
    rewards: [
      {
        symbol: 'KNC',
        logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/9444.png',
      },
    ],
    information: '',
  },

  // {
  //   poolToken1Symbol: 'BTT',
  //   poolToken1Logo: 'https://coin.top/production/logo/1002000.png',
  //   poolToken2Symbol: 'BNB',
  //   poolToken2Logo: 'https://coin.top/production/upload/logo/TDgkC3ZZBgaDqkteSgx9F14rPfqRgktyzh.jpeg',
  //   startingIn: 'Thursday, April 21, 2022 7:00:00 PM GMT+07:00',
  //   network: ChainId.BTTC,
  //   rewards: [
  //     {
  //       symbol: 'BTT',
  //       logo: 'https://coin.top/production/logo/1002000.png',
  //     },
  //   ],
  //   information: '',
  // },

  // {
  //   poolToken1Symbol: 'ETH',
  //   poolToken1Logo:
  //     'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/assets/0x2170Ed0880ac9A755fd29B2688956BD959F933F8/logo.png',
  //   poolToken2Symbol: 'WBTC_e',
  //   poolToken2Logo: 'https://bttcscan.com/token/images/wrappedbtcbtt_32.png',
  //   startingIn: 'Thursday, April 21, 2022 7:00:00 PM GMT+07:00',
  //   network: ChainId.BTTC,
  //   rewards: [
  //     {
  //       symbol: 'BTT',
  //       logo: 'https://coin.top/production/logo/1002000.png',
  //     },
  //   ],
  //   information: '',
  // },

  // {
  //   poolToken1Symbol: 'USDC.t',
  //   poolToken1Logo: 'https://bttcscan.com/token/images/usdcbttc_32.png',
  //   poolToken2Symbol: 'USDC.e',
  //   poolToken2Logo: 'https://bttcscan.com/token/images/usdcbttc_32.png',
  //   startingIn: 'Thursday, April 21, 2022 7:00:00 PM GMT+07:00',
  //   network: ChainId.BTTC,
  //   rewards: [
  //     {
  //       symbol: 'BTT',
  //       logo: 'https://coin.top/production/logo/1002000.png',
  //     },
  //   ],
  //   information: '',
  // },

  // {
  //   poolToken1Symbol: 'USDC.t',
  //   poolToken1Logo: 'https://bttcscan.com/token/images/usdcbttc_32.png',
  //   poolToken2Symbol: 'USDC.b',
  //   poolToken2Logo: 'https://bttcscan.com/token/images/usdcbttc_32.png',
  //   startingIn: 'Thursday, April 21, 2022 7:00:00 PM GMT+07:00',
  //   network: ChainId.BTTC,
  //   rewards: [
  //     {
  //       symbol: 'BTT',
  //       logo: 'https://coin.top/production/logo/1002000.png',
  //     },
  //   ],
  //   information: '',
  // },

  {
    poolToken1Symbol: 'WBTT',
    poolToken1Logo: 'https://coin.top/production/logo/1002000.png',
    poolToken2Symbol: 'TRX',
    poolToken2Logo: 'https://coin.top/production/upload/logo/TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR.png',
    startingIn: 'Thursday, April 21, 2022 7:00:00 PM GMT+07:00',
    network: ChainId.BTTC,
    rewards: [
      {
        symbol: 'BTT',
        logo: 'https://coin.top/production/logo/1002000.png',
      },
    ],
    information: '',
  },
  {
    poolToken1Symbol: 'WBTT',
    poolToken1Logo: 'https://coin.top/production/logo/1002000.png',
    poolToken2Symbol: 'USDT.t',
    poolToken2Logo: 'https://coin.top/production/logo/usdtlogo.png',
    startingIn: 'Thursday, April 21, 2022 7:00:00 PM GMT+07:00',
    network: ChainId.BTTC,
    rewards: [
      {
        symbol: 'BTT',
        logo: 'https://coin.top/production/logo/1002000.png',
      },
    ],
    information: '',
  },

  {
    poolToken1Symbol: 'TRX',
    poolToken1Logo: 'https://coin.top/production/upload/logo/TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR.png',
    poolToken2Symbol: 'USDT.t',
    poolToken2Logo: 'https://coin.top/production/logo/usdtlogo.png',
    startingIn: 'Thursday, April 21, 2022 7:00:00 PM GMT+07:00',
    network: ChainId.BTTC,
    rewards: [
      {
        symbol: 'BTT',
        logo: 'https://coin.top/production/logo/1002000.png',
      },
    ],
    information: '',
  },

  {
    poolToken1Symbol: 'USDT.t',
    poolToken1Logo: 'https://coin.top/production/logo/usdtlogo.png',
    poolToken2Symbol: 'USDT.e',
    poolToken2Logo: 'https://coin.top/production/logo/usdtlogo.png',
    startingIn: 'Thursday, April 21, 2022 7:00:00 PM GMT+07:00',
    network: ChainId.BTTC,
    rewards: [
      {
        symbol: 'BTT',
        logo: 'https://coin.top/production/logo/1002000.png',
      },
    ],
    information: '',
  },

  {
    poolToken1Symbol: 'USDT.t',
    poolToken1Logo: 'https://coin.top/production/logo/usdtlogo.png',
    poolToken2Symbol: 'USDT.b',
    poolToken2Logo: 'https://coin.top/production/logo/usdtlogo.png',
    startingIn: 'Thursday, April 21, 2022 7:00:00 PM GMT+07:00',
    network: ChainId.BTTC,
    rewards: [
      {
        symbol: 'BTT',
        logo: 'https://coin.top/production/logo/1002000.png',
      },
    ],
    information: '',
  },
]

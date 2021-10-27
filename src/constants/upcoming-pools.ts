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
    poolToken1Symbol: 'UND',
    poolToken1Logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7848.png',
    poolToken2Symbol: 'USDT',
    poolToken2Logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
    network: ChainId.MAINNET,
    rewards: [
      {
        symbol: 'KNC',
        logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/9444.png'
      },
      {
        symbol: 'UND',
        logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7848.png'
      }
    ],
    information: 'https://gov.kyber.org/t/joint-liquidity-mining-on-ethereum-with-unbound-finance-on-kyber-dmm/486'
  },
  {
    poolToken1Symbol: 'UND',
    poolToken1Logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7848.png',
    poolToken2Symbol: 'KNC',
    poolToken2Logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/9444.png',
    network: ChainId.MAINNET,
    rewards: [
      {
        symbol: 'KNC',
        logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/9444.png'
      },
      {
        symbol: 'UND',
        logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7848.png'
      }
    ],
    information: 'https://gov.kyber.org/t/joint-liquidity-mining-on-ethereum-with-unbound-finance-on-kyber-dmm/486'
  },
  {
    poolToken1Symbol: 'UND',
    poolToken1Logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7848.png',
    poolToken2Symbol: 'UNB',
    poolToken2Logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7846.png',
    network: ChainId.MAINNET,
    rewards: [
      {
        symbol: 'KNC',
        logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/9444.png'
      },
      {
        symbol: 'UND',
        logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7848.png'
      }
    ],
    information: 'https://gov.kyber.org/t/joint-liquidity-mining-on-ethereum-with-unbound-finance-on-kyber-dmm/486'
  }
]

import { ChainId } from 'libs/sdk/src'

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
  rewards: Reward[]
  information: string
}

export const UPCOMING_POOLS: { [chainId in ChainId]: UpcomingPool[] } = {
  [ChainId.MAINNET]: [
    {
      poolToken1Symbol: 'UND',
      poolToken1Logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7848.png',
      poolToken2Symbol: 'USDT',
      poolToken2Logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
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
      poolToken1Symbol: 'EVRY',
      poolToken1Logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11458.png',
      poolToken2Symbol: 'ETH',
      poolToken2Logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
      rewards: [
        {
          symbol: 'KNC',
          logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/9444.png'
        },
        {
          symbol: 'EVRY',
          logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11458.png'
        }
      ],
      information: 'https://gov.kyber.org/t/evrynet-evry-joint-liquidity-mining-on-kyber-dmm/481'
    },
    {
      poolToken1Symbol: 'EVRY',
      poolToken1Logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11458.png',
      poolToken2Symbol: 'USDT',
      poolToken2Logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
      rewards: [
        {
          symbol: 'KNC',
          logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/9444.png'
        },
        {
          symbol: 'EVRY',
          logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11458.png'
        }
      ],
      information: 'https://gov.kyber.org/t/evrynet-evry-joint-liquidity-mining-on-kyber-dmm/481'
    }
  ],
  [ChainId.ROPSTEN]: [],
  [ChainId.RINKEBY]: [],
  [ChainId.GÖRLI]: [],
  [ChainId.KOVAN]: [],
  [ChainId.MATIC]: [],
  [ChainId.MUMBAI]: [],
  [ChainId.BSCTESTNET]: [],
  [ChainId.BSCMAINNET]: [],
  [ChainId.AVAXTESTNET]: [],
  [ChainId.AVAXMAINNET]: []
}

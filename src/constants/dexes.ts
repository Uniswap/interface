import { ChainId } from '@dynamic-amm/sdk'

export type DexConfig = {
  value?: string
  name: string
  icon: string
  chainIds?: ChainId[]
}

type DexList = { [key: string]: DexConfig }

export const dexListConfig: DexList = {
  dmm: {
    name: 'DMM',
    icon: 'https://dmm.exchange/favicon.png',
    chainIds: [ChainId.MAINNET, ChainId.MATIC, ChainId.BSCMAINNET, ChainId.AVAXMAINNET]
  },
  uniswap: {
    name: 'UniSwap_V2',
    icon: 'https://www.logowik.com/content/uploads/images/uniswap-uni7403.jpg',
    chainIds: [ChainId.MAINNET]
  },
  sushiswap: {
    name: 'SushiSwap',
    icon: 'https://sushi.com/favicon.ico',
    chainIds: [ChainId.MAINNET, ChainId.MATIC]
  },
  quickswap: {
    name: 'QuickSwap',
    icon: 'https://quickswap.exchange/logo_circle.png',
    chainIds: [ChainId.MATIC]
  },
  dfyn: {
    name: 'Dfyn',
    icon: 'https://dfyn.network/assets/logos/dfyn-favicon.png',
    chainIds: [ChainId.MATIC]
  },
  firebird: {
    name: 'Firebird',
    icon: 'https://app.firebird.finance/favicon.png',
    chainIds: [ChainId.MATIC, ChainId.BSCMAINNET]
  },
  oneswap: {
    name: 'OneSwap',
    icon: 'https://app.firebird.finance/favicon.png',
    chainIds: [ChainId.MATIC, ChainId.BSCMAINNET]
  },
  wault: {
    name: 'Wault',
    icon: 'https://wault.finance/wp-content/uploads/2021/04/cropped-wault-new-favicon-32x32.png',
    chainIds: [ChainId.MATIC, ChainId.BSCMAINNET]
  },
  curve: {
    name: 'Curve',
    icon: 'https://curve.fi/favicon-32x32.svg',
    chainIds: [ChainId.MAINNET, ChainId.MATIC]
  },
  jetswap: {
    name: 'JetSwap',
    icon: 'https://jetswap.finance/favicon_io/favicon.ico',
    chainIds: [ChainId.MATIC, ChainId.BSCMAINNET]
  },
  'iron-stable': {
    name: 'IronSwap',
    icon: 'https://iron.finance/icons/icon-72x72.png',
    chainIds: [ChainId.MATIC, ChainId.AVAXMAINNET]
  },
  polydex: {
    name: 'PolyDex',
    icon: 'https://www.polydex.fi/favicon.ico',
    chainIds: [ChainId.MATIC]
  },
  polycat: {
    name: 'Polycat',
    icon: 'https://polycat.finance/favicon-32x32.png',
    chainIds: [ChainId.MATIC]
  },
  pancake: {
    name: 'PancakeSwap',
    icon: 'https://pancakeswap.finance/favicon.ico',
    chainIds: [ChainId.BSCMAINNET]
  },
  mdex: {
    name: 'Mdex',
    icon: 'https://cdn.jsdelivr.net/gh/mdexSwap/hswap@main/favicon.png',
    chainIds: [ChainId.BSCMAINNET]
  },
  biswap: {
    name: 'Biswap',
    icon: 'https://biswap.org/logo.png',
    chainIds: [ChainId.BSCMAINNET]
  },
  apeswap: {
    name: 'ApeSwap',
    icon: 'https://apeswap.finance/favicon.ico',
    chainIds: [ChainId.BSCMAINNET]
  },
  ellipsis: {
    name: 'Ellipsis',
    icon: 'https://ellipsis.finance/ellipsis-light.png',
    chainIds: [ChainId.BSCMAINNET]
  },
  nerve: {
    name: 'Nerve',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/8755.png',
    chainIds: [ChainId.BSCMAINNET]
  },
  pangolin: {
    name: 'Pangolin',
    icon: 'https://pangolin.exchange/icon.svg',
    chainIds: [ChainId.AVAXMAINNET]
  },
  traderjoe: {
    name: 'TraderJoe',
    icon: 'https://www.traderjoexyz.com/favicon.png',
    chainIds: [ChainId.AVAXMAINNET]
  }
}

type DexTypes = {
  [chainId in ChainId]?: {
    [dex: string]: 0 | 1 | 2 | 3 | 4 | 5 | 6
  }
}
/*
// dex id - swap fee
1 - 30 (default) = 0.3%
2 - 25
3 - 20
4 - 15
5 - 10
6 - 5
*/
export const dexIds: DexTypes = {
  [ChainId.BSCMAINNET]: {
    firebird: 1,
    pancake: 2,
    apeswap: 3,
    wault: 3,
    biswap: 5
  },
  [ChainId.MATIC]: {
    firebird: 1,
    polydex: 5,
    wault: 3,
    jetswap: 5,
    polycat: 2
  }
}

export const dexTypes: DexTypes = {
  [ChainId.MAINNET]: {
    curve: 2,
    dmm: 3
  },
  [ChainId.BSCMAINNET]: {
    oneswap: 1,
    curve: 2,
    ellipsis: 2,
    nerve: 1,
    dmm: 3
  },
  [ChainId.MATIC]: {
    oneswap: 1,
    curve: 2,
    dmm: 3,
    'iron-stable': 4
  },
  [ChainId.AVAXMAINNET]: {
    curve: 2,
    dmm: 3,
    'iron-stable': 4
  }
}

function findDex(exchange: string): DexConfig | undefined {
  const dex = dexListConfig[exchange]
  return dex ? { ...dex, value: exchange } : undefined
}

export const DEX_TO_COMPARE: { [chainId in ChainId]?: DexConfig } = {
  [ChainId.BSCMAINNET]: findDex('pancake'),
  [ChainId.MATIC]: findDex('quickswap'),
  [ChainId.AVAXMAINNET]: findDex('traderjoe'),
  [ChainId.MAINNET]: findDex('uniswap')
}

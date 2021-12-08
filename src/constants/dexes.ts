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
    name: 'KyberSwap',
    icon: 'https://kyberswap.com/favicon.ico',
    chainIds: [ChainId.MAINNET, ChainId.MATIC, ChainId.BSCMAINNET, ChainId.AVAXMAINNET, ChainId.FANTOM, ChainId.CRONOS]
  },
  uniswap: {
    name: 'UniSwap_V2',
    icon: 'https://www.logowik.com/content/uploads/images/uniswap-uni7403.jpg',
    chainIds: [ChainId.MAINNET]
  },
  sushiswap: {
    name: 'SushiSwap',
    icon: 'https://sushi.com/favicon.ico',
    chainIds: [ChainId.MAINNET, ChainId.MATIC, ChainId.FANTOM]
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
    chainIds: [ChainId.MAINNET, ChainId.MATIC, ChainId.FANTOM]
  },
  jetswap: {
    name: 'JetSwap',
    icon: 'https://jetswap.finance/favicon_io/favicon.ico',
    chainIds: [ChainId.MATIC, ChainId.BSCMAINNET, ChainId.FANTOM]
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
  'pancake-legacy': {
    name: 'PancakeSwap Legacy',
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
  },
  spookyswap: {
    name: 'SpookySwap',
    icon: 'https://spookyswap.finance/favicon.ico',
    chainIds: [ChainId.FANTOM]
  },
  spiritswap: {
    name: 'SpiritSwap',
    icon: 'https://app.spiritswap.finance/favicon-32x32.png',
    chainIds: [ChainId.FANTOM]
  },
  paintswap: {
    name: 'PaintSwap',
    icon: 'https://paintswap.finance/favicon.png',
    chainIds: [ChainId.FANTOM]
  },
  synapse: {
    name: 'Synapse',
    icon: 'https://synapseprotocol.com/favicon.ico',
    chainIds: [ChainId.MAINNET, ChainId.BSCMAINNET, ChainId.MATIC, ChainId.AVAXMAINNET, ChainId.FANTOM]
  },
  balancer: {
    name: 'Balancer',
    icon: 'https://app.balancer.fi/favicon.ico',
    chainIds: [ChainId.MAINNET, ChainId.MATIC]
  },
  axial: {
    name: 'Axial',
    icon: 'https://assets.website-files.com/6189dee5e79d6e8f7e214eba/618bf2f3e40e777d4210a84f_favicon.ico',
    chainIds: [ChainId.AVAXMAINNET]
  },
  vvs: {
    name: 'VVS Finance',
    icon: 'https://vvs.finance/favicon.ico',
    chainIds: [ChainId.CRONOS]
  },
  cronaswap: {
    name: 'CronaSwap',
    icon: 'https://app.cronaswap.org/favicon.png',
    chainIds: [ChainId.CRONOS]
  },
  crodex: {
    name: 'Crodex',
    icon: 'https://swap.crodex.app/favicon.png',
    chainIds: [ChainId.CRONOS]
  }
}

type DexTypes = {
  [chainId in ChainId | 'all']?: {
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
  all: {
    firebird: 1,
    pancake: 2,
    'pancake-legacy': 2,
    apeswap: 3,
    wault: 3,
    biswap: 5,
    polydex: 5,
    jetswap: 5,
    polycat: 2,
    spookyswap: 3,
    axial: 3,
    cronaswap: 2
  },
  [ChainId.BSCMAINNET]: {
    jetswap: 1
  },
  [ChainId.MATIC]: {}
}

export const dexTypes: DexTypes = {
  all: {
    curve: 2,
    dmm: 3,
    oneswap: 1,
    ellipsis: 2,
    nerve: 1,
    'iron-stable': 4,
    balancer: 6,
    synapse: 4,
    axial: 4
  },
  [ChainId.MAINNET]: {},
  [ChainId.BSCMAINNET]: {},
  [ChainId.MATIC]: {},
  [ChainId.AVAXMAINNET]: {},
  [ChainId.FANTOM]: {}
}

function findDex(exchange: string): DexConfig | undefined {
  const dex = dexListConfig[exchange]
  return dex ? { ...dex, value: exchange } : undefined
}

export const DEX_TO_COMPARE: { [chainId in ChainId]?: DexConfig } = {
  [ChainId.BSCMAINNET]: findDex('pancake'),
  [ChainId.MATIC]: findDex('quickswap'),
  [ChainId.AVAXMAINNET]: findDex('traderjoe'),
  [ChainId.MAINNET]: findDex('uniswap'),
  [ChainId.FANTOM]: findDex('spookyswap'),
  [ChainId.CRONOS]: findDex('vvs')
}

import { ChainId } from '@kyberswap/ks-sdk-core'

export type DexConfig = {
  value?: string
  name: string
  icon: string
}

type DexList = { [key: string]: DexConfig }

export const dexListConfig: DexList = {
  dmm: {
    name: 'KyberSwap Classic',
    icon: 'https://kyberswap.com/favicon.ico',
  },
  kyberswapv2: {
    name: 'KyberSwap Elastic',
    icon: 'https://kyberswap.com/favicon.ico',
  },
  kyberswap: {
    name: 'KyberSwap Classic',
    icon: 'https://kyberswap.com/favicon.ico',
  },
  'kyberswap-static': {
    name: 'KyberSwap Classic',
    icon: 'https://kyberswap.com/favicon.ico',
  },
  uniswap: {
    name: 'UniSwap_V2',
    icon: 'https://www.logowik.com/content/uploads/images/uniswap-uni7403.jpg',
  },
  uniswapv3: {
    name: 'UniSwap_V3',
    icon: 'https://www.logowik.com/content/uploads/images/uniswap-uni7403.jpg',
  },
  sushiswap: {
    name: 'SushiSwap',
    icon: 'https://res.cloudinary.com/sushi-cdn/image/fetch/f_auto,c_limit,w_32,q_auto/https://app.sushi.com/images/logo.svg',
  },
  shibaswap: {
    name: 'ShibaSwap',
    icon: 'https://shibaswap.com/images/logo_shiba_swap.png',
  },
  defiswap: {
    name: 'DefiSwap',
    icon: 'https://crypto.com/defi/swap/favicon.c5a5b109.png',
  },
  quickswap: {
    name: 'QuickSwap',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/200x200/8206.png',
  },
  dfyn: {
    name: 'Dfyn',
    icon: 'https://dfyn.network/assets/logos/dfyn-favicon.png',
  },
  firebird: {
    name: 'Firebird',
    icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/1500.png',
  },
  oneswap: {
    name: 'OneSwap',
    icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/1170.png',
  },
  wault: {
    name: 'Wault',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/9478.png',
  },
  curve: {
    name: 'Curve',
    icon: 'https://curve.fi/favicon-32x32.svg',
  },
  jetswap: {
    name: 'JetSwap',
    icon: 'https://jetswap.finance/favicon_io/favicon.ico',
  },
  'iron-stable': {
    name: 'IronSwap',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/10484.png',
  },
  polydex: {
    name: 'PolyDex',
    icon: 'https://www.polydex.fi/favicon.ico',
  },
  polycat: {
    name: 'Polycat',
    icon: 'https://polycat.finance/favicon-32x32.png',
  },
  gravity: {
    name: 'Gravity',
    icon: 'https://gravityfinance.io/favicon.ico',
  },
  cometh: {
    name: 'ComethSwap',
    icon: 'https://swap.cometh.io/favicon.ico',
  },
  dinoswap: {
    name: 'DinoSwap',
    icon: 'https://dinoswap.exchange/favicon.ico',
  },
  pancake: {
    name: 'PancakeSwap',
    icon: 'https://pancakeswap.finance/favicon.ico',
  },
  'pancake-legacy': {
    name: 'PancakeSwap Legacy',
    icon: 'https://pancakeswap.finance/favicon.ico',
  },
  mdex: {
    name: 'Mdex',
    icon: 'https://cdn.jsdelivr.net/gh/mdexSwap/hswap@main/favicon.png',
  },
  biswap: {
    name: 'Biswap',
    icon: 'https://biswap.org/logo.png',
  },
  apeswap: {
    name: 'ApeSwap',
    icon: 'https://apeswap.finance/favicon.ico',
  },
  ellipsis: {
    name: 'Ellipsis',
    icon: 'https://ellipsis.finance/ellipsis-light.png',
  },
  safeswap: {
    name: 'SafeSwap',
    icon: 'https://safeswap.yfdai.finance/favicon.png',
  },
  pantherswap: {
    name: 'PantherSwap',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/9778.png',
  },
  nerve: {
    name: 'Nerve',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/8755.png',
  },
  pangolin: {
    name: 'Pangolin',
    icon: 'https://pangolin.exchange/icon.svg',
  },
  traderjoe: {
    name: 'TraderJoe',
    icon: 'https://www.traderjoexyz.com/favicon.png',
  },
  spookyswap: {
    name: 'SpookySwap',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/9608.png',
  },
  spiritswap: {
    name: 'SpiritSwap',
    icon: 'https://app.spiritswap.finance/favicon-32x32.png',
  },
  paintswap: {
    name: 'PaintSwap',
    icon: 'https://paintswap.finance/favicon.png',
  },
  morpheus: {
    name: 'MorpheusSwap',
    icon: 'https://morpheusswap.app/favicon.ico',
  },
  beethovenx: {
    name: 'beethoven-x',
    icon: 'https://app.beets.fi/favicon.ico',
  },
  synapse: {
    name: 'Synapse',
    icon: 'https://synapseprotocol.com/favicon.ico',
  },
  saddle: {
    name: 'Saddle',
    icon: 'https://saddle.finance/favicon-32x32.png',
  },
  balancer: {
    name: 'Balancer',
    icon: 'https://app.balancer.fi/favicon.ico',
  },
  axial: {
    name: 'Axial',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/14396.png',
  },
  lydia: {
    name: 'Lydia',
    icon: 'https://www.lydia.finance/favicon.ico',
  },
  yetiswap: {
    name: 'Yeti Swap',
    icon: 'https://exchange.yetiswap.app/favicon.png',
  },
  hurricane: {
    name: 'HurricaneSwap',
    icon: 'https://hurricaneswap.com/favicon.png',
  },
  vvs: {
    name: 'VVS Finance',
    icon: 'https://vvs.finance/favicon.ico',
  },
  cronaswap: {
    name: 'CronaSwap',
    icon: 'https://app.cronaswap.org/favicon.png',
  },
  crodex: {
    name: 'Crodex',
    icon: 'https://swap.crodex.app/favicon.png',
  },
  mmf: {
    name: 'Mad Meerkat Finance',
    icon: 'https://mm.finance/favicon.ico',
  },
  kryptodex: {
    name: 'KryptoDEX',
    icon: 'https://www.kryptodex.org/favicon.svg',
  },
  empiredex: {
    name: 'Empire Dex',
    icon: 'https://bsc.empiredex.org/favicon.png',
  },
  photonswap: {
    name: 'PhotonSwap',
    icon: 'https://photonswap.finance/logo.png',
  },
  trisolaris: {
    name: 'Trisolaris',
    icon: 'https://www.trisolaris.io/favicon.png',
  },
  wannaswap: {
    name: 'WannaSwap',
    icon: 'https://wannaswap.finance/icon.png',
  },
  nearpad: {
    name: 'NearPAD',
    icon: 'https://i.imgur.com/6IFKjOZ.png',
  },
  swapr: {
    name: 'Swapr',
    icon: 'https://swapr.eth.link/favicon.png',
  },
  wagyuswap: {
    name: 'WagyuSwap',
    icon: 'https://exchange.wagyuswap.app/images/logo.png',
  },
  astroswap: {
    name: 'AstroSwap',
    icon: 'https://exchange.astroswap.app/images/logo.png',
  },
  yuzuswap: {
    name: 'YuzuSwap',
    icon: 'https://yuzu-swap.com/yuzu-white.2d6bbbe6.svg',
  },
  lizard: {
    name: 'Lizard Exchange',
    icon: 'https://lizard.exchange/static/media/lizard_white.17de6ee5.svg',
  },
  valleyswap: {
    name: 'ValleySwap_V1',
    icon: 'https://valleyswap.com/images/logo_valley-swap_mob.svg',
  },
  'valleyswap-v2': {
    name: 'ValleySwap_V2',
    icon: 'https://valleyswap.com/images/logo_valley-swap_mob.svg',
  },
  gemkeeper: {
    name: 'GemKeeper',
    icon: 'https://gemkeeper.finance/static/media/main_logo.0ec96048.png',
  },
  dodo: {
    name: 'DODO',
    icon: 'https://dodoex.io/favicon.ico',
  },
  zipswap: {
    name: 'ZipSwap',
    icon: 'https://zipswap.fi/static/media/logo.414dd3f8.png',
  },
  '1inch': {
    name: '1inch',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/8104.png',
  },
  platypus: {
    name: 'Platypus',
    icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/1674.png',
  },
  velodrome: {
    name: 'Velodrome',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/20435.png',
  },

  //todo namgold: optimism add dex
}

type DexTypes = {
  [chainId in ChainId | 'all']?: {
    [dex: string]: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
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
7 - 17 = 0.17%
8 - 18 = 0.18%
9 - 50 = 0.5%
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
    cronaswap: 2,
    gravity: 2,
    kyberswap: 0,
    mmf: 7,
    kryptodex: 3,
    cometh: 9,
    dinoswap: 8,
    safeswap: 2,
    pantherswap: 3,
    morpheus: 4,
    wannaswap: 3,
    swapr: 2,
    wagyuswap: 3,
    astroswap: 3,
  },
  [ChainId.BSCMAINNET]: {
    jetswap: 1,
  },
  [ChainId.MATIC]: {},
}

// For encoding
export const dexTypes: DexTypes = {
  all: {
    curve: 2,
    dmm: 3,
    kyberswap: 3,
    oneswap: 1,
    ellipsis: 2,
    nerve: 1,
    'iron-stable': 4,
    balancer: 6,
    synapse: 4,
    saddle: 4,
    axial: 4,
    beethovenx: 6,
    uniswapv3: 5,
    kyberswapv2: 5,
    kyberswapStatic: 3,
  },
  [ChainId.MAINNET]: {},
  [ChainId.BSCMAINNET]: {},
  [ChainId.MATIC]: {},
  [ChainId.AVAXMAINNET]: {},
  [ChainId.FANTOM]: {},
  [ChainId.VELAS]: {},
  [ChainId.OASIS]: {},
}

function findDex(exchange: string): DexConfig | undefined {
  const dex = dexListConfig[exchange]
  return dex ? { ...dex, value: exchange } : undefined
}

export const DEX_TO_COMPARE: { [chainId in ChainId]?: DexConfig } = {
  [ChainId.BSCMAINNET]: findDex('pancake'),
  [ChainId.MATIC]: findDex('quickswap'),
  [ChainId.AVAXMAINNET]: findDex('traderjoe'),
  [ChainId.MAINNET]: findDex('uniswapv3'),
  [ChainId.FANTOM]: findDex('spookyswap'),
  [ChainId.CRONOS]: findDex('vvs'),
  [ChainId.AURORA]: findDex('trisolaris'),
  [ChainId.ARBITRUM]: findDex('sushiswap'),
  [ChainId.VELAS]: findDex('wagyuswap'),
  [ChainId.OASIS]: findDex('valleyswap-v2'),
  [ChainId.OPTIMISM]: findDex('uniswapv3'),
}

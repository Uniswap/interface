const SPECIAL_CASE_TOKEN_COLORS: { [key: string]: string } = {
  // old WBTC
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png':
    '#F09241',
  // new WBTC
  'https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png?1548822744': '#F09241',
  // WBTC (current V2 GetToken logo)
  'https://coin-images.coingecko.com/coins/images/7598/large/WBTCLOGO.png?1764496367': '#F09241',
  // DAI
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png':
    '#FAB01B',
  // DAI (current V2 GetToken logo)
  'https://coin-images.coingecko.com/coins/images/9956/large/Badge_Dai.png?1696509996': '#FAB01B',
  // UNI
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png':
    '#E6358C',
  // UNI (current V2 GetToken logo)
  'https://coin-images.coingecko.com/coins/images/12504/large/uniswap-logo.png?1720676669': '#E6358C',
  // BUSD
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x4Fabb145d64652a948d72533023f6E7A623C7C53/logo.png':
    '#EFBA09',
  // BUSD (current V2 GetToken logo)
  'https://coin-images.coingecko.com/coins/images/9576/large/BUSDLOGO.jpg?1696509654': '#EFBA09',
  // AI-X
  'https://s2.coinmarketcap.com/static/img/coins/64x64/26984.png': '#29A1F1',
  // AI-X (current V2 GetToken logo)
  'https://coin-images.coingecko.com/coins/images/30783/large/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20230616171447.jpg?1696529650':
    '#29A1F1',
  // ETH
  'https://token-icons.s3.amazonaws.com/eth.png': '#4970D5',
  'https://didcmo2jyrnku.cloudfront.net/assets/eth.png': '#4970D5',
  // ETH (current V2 GetToken logo)
  'https://ethereum-optimism.github.io/data/ETH/logo.svg': '#4970D5',
  // Ethereum L1 chain logo (`…/ethereum/info/logo.png` from chain assets — same accent as ETH icons above)
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/info/logo.png': '#4970D5',
  // Monad chain logo — vibrant extraction skews dark/indigo; use brand purple from networkColors.monad
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/monad/info/logo.png': '#836EF9',
  // HARRYPOTTERSHIBAINUBITCOIN
  'https://assets.coingecko.com/coins/images/30323/large/hpos10i_logo_casino_night-dexview.png?1684117567': '#DE3110',
  // HARRYPOTTERSHIBAINUBITCOIN (current V2 GetToken logo)
  'https://coin-images.coingecko.com/coins/images/30323/large/hpos10i_logo_casino_night-dexview.png?1696529224':
    '#DE3110',
  // PEPE
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x6982508145454Ce325dDbE47a25d4ec3d2311933/logo.png':
    '#3EAE14',
  // PEPE (current V2 GetToken logo)
  'https://coin-images.coingecko.com/coins/images/29850/large/pepe-token.jpeg?1696528776': '#3EAE14',
  // Unibot V2
  'https://s2.coinmarketcap.com/static/img/coins/64x64/25436.png': '#4A0A4F',
  // UNIBOT v1
  'https://assets.coingecko.com/coins/images/30462/small/logonoline_%281%29.png?1687510315': '#4A0A4F',
  // UNIBOT (current V2 GetToken logo)
  'https://coin-images.coingecko.com/coins/images/30462/large/logonoline_%281%29.png?1696529349': '#4A0A4F',
  // USDC
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png':
    '#0066D9',
  'https://coin-images.coingecko.com/coins/images/6319/large/usdc.png?1696506694': '#0066D9',
  // USDC (current V2 GetToken logo)
  'https://coin-images.coingecko.com/coins/images/6319/large/USDC.png?1769615602': '#0066D9',
  // HEX
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39/logo.png':
    '#F93F8C',
  // HEX (current V2 GetToken logo)
  'https://coin-images.coingecko.com/coins/images/10103/large/HEX-logo.png?1696510130': '#F93F8C',
  // MONG
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x1ce270557C1f68Cfb577b856766310Bf8B47FD9C/logo.png':
    '#A96DFF',
  // MONG (current V2 GetToken logo)
  'https://coin-images.coingecko.com/coins/images/30051/large/BrandMark.png?1721838570': '#A96DFF',
  // ARB
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xB50721BCf8d664c30412Cfbc6cf7a15145234ad1/logo.png':
    '#29A1F1',
  // ARB (current V2 GetToken logo)
  'https://coin-images.coingecko.com/coins/images/16547/large/arb.jpg?1721358242': '#29A1F1',
  // PSYOP
  'https://s2.coinmarketcap.com/static/img/coins/64x64/25422.png': '#E88F00',
  // MATIC
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0/logo.png':
    '#A96DFF',
  // MATIC (current V2 GetToken logo)
  'https://assets.coingecko.com/coins/images/4713/thumb/matic-token-icon.png?1624446912': '#A96DFF',
  // TURBO
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xA35923162C49cF95e6BF26623385eb431ad920D3/logo.png':
    '#BD6E29',
  // TURBO (current V2 GetToken logo)
  'https://coin-images.coingecko.com/coins/images/30117/large/TurboMark-QL_200.png?1708079597': '#BD6E29',
  // AIDOGE
  'https://assets.coingecko.com/coins/images/29852/large/photo_2023-04-18_14-25-28.jpg?1681799160': '#29A1F1',
  // AIDOGE (current V2 GetToken logo)
  'https://coin-images.coingecko.com/coins/images/29852/large/photo_2023-04-18_14-25-28.jpg?1696528778': '#29A1F1',
  // SIMPSON
  'https://assets.coingecko.com/coins/images/30243/large/1111.png?1683692033': '#E88F00',
  // SIMPSON (current V2 GetToken logo)
  'https://s2.coinmarketcap.com/static/img/coins/64x64/25081.png': '#E88F00',
  // MAKER
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2/logo.png':
    '#50B197',
  // MAKER (current V2 GetToken logo)
  'https://coin-images.coingecko.com/coins/images/1364/large/Mark_Maker.png?1696502423': '#50B197',
  // OX
  'https://assets.coingecko.com/coins/images/30604/large/Logo2.png?1685522119': '#2959D9',
  // OX (current V2 GetToken logo)
  'https://s2.coinmarketcap.com/static/img/coins/64x64/26543.png': '#2959D9',
  // ANGLE
  'https://assets.coingecko.com/coins/images/19060/large/ANGLE_Token-light.png?1666774221': '#FF5555',
  // ANGLE (current V2 GetToken logo)
  'https://coin-images.coingecko.com/coins/images/19060/large/ANGLE_Token-light.png?1696518509': '#FF5555',
  // APE
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x4d224452801ACEd8B2F0aebE155379bb5D594381/logo.png':
    '#054AA9',
  // APE (current V2 GetToken logo)
  'https://coin-images.coingecko.com/coins/images/24383/large/APECOIN.png?1756551529': '#054AA9',
  // GUSD
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x056Fd409E1d7A124BD7017459dFEa2F387b6d5Cd/logo.png':
    '#00A4BD',
  // GUSD (current V2 GetToken logo)
  'https://coin-images.coingecko.com/coins/images/5992/large/gemini-dollar-gusd.png?1696506408': '#00A4BD',
  // OGN
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x8207c1FfC5B6804F6024322CcF34F29c3541Ae26/logo.png':
    '#054AA9',
  // OGN (current V2 GetToken logo)
  'https://coin-images.coingecko.com/coins/images/3296/large/op.jpg?1696504006': '#054AA9',
  // RPL
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xD33526068D116cE69F19A9ee46F0bd304F21A51f/logo.png':
    '#FF7B4F',
  // RPL (current V2 GetToken logo)
  'https://coin-images.coingecko.com/coins/images/2090/large/rocket_pool_%28RPL%29.png?1696503058': '#FF7B4F',
  // TODO | Toucan: remove once token auction goes live
  // ToucanToken - Demo token for bid distribution chart testing. This ensures
  // the token has a consistent brand color in the chart UI during development.
  'https://assets.coingecko.com/coins/images/69445/standard/FSuv7Zpo_400x400.png?1758616860': '#01429f',
}

const COINGECKO_IMAGE_ID_PATTERN = /^https:\/\/(?:assets|coin-images)\.coingecko\.com\/coins\/images\/(\d+)\//i

function getCoinGeckoImageId(imageUrl: string): string | undefined {
  return imageUrl.match(COINGECKO_IMAGE_ID_PATTERN)?.[1]
}

const COINGECKO_SPECIAL_CASE_TOKEN_COLORS = new Map<string, string>()

// CoinGecko entries also feed the image-ID lookup; keep one entry per image ID.
for (const [imageUrl, color] of Object.entries(SPECIAL_CASE_TOKEN_COLORS)) {
  const imageId = getCoinGeckoImageId(imageUrl)
  if (imageId) {
    COINGECKO_SPECIAL_CASE_TOKEN_COLORS.set(imageId, color)
  }
}

export function getSpecialCaseTokenColorOverride(imageUrl: string): string | undefined {
  const exactMatch = Object.prototype.hasOwnProperty.call(SPECIAL_CASE_TOKEN_COLORS, imageUrl)
    ? SPECIAL_CASE_TOKEN_COLORS[imageUrl]
    : undefined
  if (exactMatch) {
    return exactMatch
  }

  const imageId = getCoinGeckoImageId(imageUrl)
  return imageId ? COINGECKO_SPECIAL_CASE_TOKEN_COLORS.get(imageId) : undefined
}

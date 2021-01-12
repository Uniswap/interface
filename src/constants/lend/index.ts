import { Interface } from '@ethersproject/abi'
import { ChainId } from '@uniswap/sdk'
import COMPTROLLER_ABI from './comptroller.json'
import CHAINLINK_PRICE_ORACLE_PROXY_ABI from './chainlink_price_oracle_proxy.json'

const COMPTROLLER_ADDRESSES: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B', // compound unitroller
  [ChainId.ROPSTEN]: '0x54188bbedd7b68228fa89cbdda5e3e930459c6c6',
  [ChainId.RINKEBY]: '0x2eaa9d77ae4d8f9cdd9faacd44016e746485bddb', // compound unitroller
  [ChainId.GÖRLI]: '0x627ea49279fd0de89186a58b8758ad02b6be2867',
  [ChainId.KOVAN]: '0x5eae89dc1c671724a672ff0630122ee834098657'
}

const ORACLE_ADDRESSES: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: '0x922018674c12a7F0D394ebEEf9B58F186CdE13c1', // compound oracle
  [ChainId.ROPSTEN]: '0xBEf4E076A995c784be6094a432b9CA99b7431A3f',
  [ChainId.RINKEBY]: '0x536426d7768b6E2E8815Fa42357FD47094071c1D', // deerfi oracle
  [ChainId.GÖRLI]: '0x9A536Ed5C97686988F93C9f7C2A390bF3B59c0ec', // not working due to lack of oracle
  [ChainId.KOVAN]: '0xbBdE93962Ca9fe39537eeA7380550ca6845F8db7'
}

const MAXIMILLION_ADDRESSES: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: '0xd4b2474044836D8E10239cF2A0D18C92fBd49222',
  [ChainId.ROPSTEN]: '0x0000000000000000000000000000000000000000',
  [ChainId.RINKEBY]: '0xFdC42cE083c54aB50f61518CED9CFB9504A42389', // deerfi maximillion
  [ChainId.GÖRLI]: '0x0000000000000000000000000000000000000000', // not working due to lack of oracle
  [ChainId.KOVAN]: '0xC363f83902Ac614F318b04771d21D25aC0d73be5'
}

const CTOKEN_LISTS: {
  [chainId in ChainId]: [string, string, number, string, string, string, string, string, string][]
} = {
  [ChainId.MAINNET]: [
    [
      '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5',
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      18,
      'cETH',
      'Compound ETH',
      'ETH',
      'Ether',
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      ''
    ],
    [
      '0x6C8c6b02E7b2BE14d4fA6022Dfd6d75921D90E4E',
      '0x0D8775F648430679A709E98d2b0Cb6250d2887EF',
      18,
      'cBAT',
      'Compound BAT',
      'BAT',
      'Basic Attention Token',
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x0D8775F648430679A709E98d2b0Cb6250d2887EF/logo.png',
      ''
    ],
    [
      '0x39AA39c021dfbaE8faC545936693aC917d5E7563',
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      6,
      'cUSDC',
      'Compound USDC',
      'USDC',
      'USD Coin',
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
      ''
    ],
    [
      '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643',
      '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      18,
      'cDAI',
      'Compound DAI',
      'DAI',
      'Dai Stablecoin',
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
      ''
    ],
    [
      '0xf650C3d88D12dB855b8bf7D11Be6C55A4e07dCC9',
      '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      6,
      'cUSDT',
      'Compound USDT',
      'USDT',
      'Tether USD',
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
      ''
    ],
    [
      '0xC11b1268C1A384e55C48c2391d8d480264A3A7F4',
      '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      8,
      'cWBTC',
      'Compound WBTC',
      'WBTC',
      'Wrapped BTC',
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png',
      ''
    ],
    [
      '0xB3319f5D18Bc0D84dD1b4825Dcde5d5f7266d407',
      '0xE41d2489571d322189246DaFA5ebDe1F4699F498',
      18,
      'cZRX',
      'Compound ZRX',
      'ZRX',
      '0x Protocol Token',
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xE41d2489571d322189246DaFA5ebDe1F4699F498/logo.png',
      ''
    ],
    [
      '0x35A18000230DA775CAc24873d00Ff85BccdeD550',
      '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      18,
      'cUNI',
      'Compound Uniswap',
      'UNI',
      'Uniswap',
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xE41d2489571d322189246DaFA5ebDe1F4699F498/logo.png',
      ''
    ],
    [
      '0x70e36f6BF80a52b3B46b3aF8e106CC0ed743E8e4',
      '0xc00e94Cb662C3520282E6f5717214004A7f26888',
      18,
      'cCOMP',
      'Compound Collateral',
      'COMP',
      'Compound',
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xE41d2489571d322189246DaFA5ebDe1F4699F498/logo.png',
      ''
    ]
  ],
  [ChainId.ROPSTEN]: [
    [
      '0x9e95c0b2412ce50c37a121622308e7a6177f819d',
      '0x443Fd8D5766169416aE42B8E050fE9422f628419',
      18,
      'cBAT',
      'Compound BAT',
      'BAT',
      'Basic Attention Token',
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x0D8775F648430679A709E98d2b0Cb6250d2887EF/logo.png',
      ''
    ],
    [
      '0x8354c3a332ffb24e3a27be252e01acfe65a33b35',
      '0x31f42841c2db5173425b5223809cf3a38fede360',
      18,
      'cDAI',
      'Compound DAI',
      'DAI',
      'Dai Stablecoin',
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
      ''
    ],
    [
      '0xbe839b6d93e3ea47effcca1f27841c917a8794f3',
      '0xc778417E063141139Fce010982780140Aa0cD5Ab',
      18,
      'cETH',
      'Compound ETH',
      'ETH',
      'Ether',
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      ''
    ],
    [
      '0x8af93cae804cc220d1a608d4fa54d1b6ca5eb361',
      '0x0d9c8723b343a8368bebe0b5e89273ff8d712e3c',
      6,
      'cUSDC',
      'Compound USDC',
      'USDC',
      'USD Coin',
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
      ''
    ],
    [
      '0x135669c2dcbd63f639582b313883f101a4497f76',
      '0x516de3a7a567d81737e3a46ec4ff9cfd1fcb0136',
      6,
      'cUSDT',
      'Compound USDT',
      'USDT',
      'Tether USD',
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
      ''
    ],
    [
      '0x58145bc5407d63daf226e4870beeb744c588f149',
      '0xbde8bb00a7ef67007a96945b3a3621177b615c44',
      8,
      'cWBTC',
      'Compound WBTC',
      'WBTC',
      'Wrapped BTC',
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png',
      ''
    ],
    [
      '0x00e02a5200ce3d5b5743f5369deb897946c88121',
      '0xe4c6182ea459e63b8f1be7c428381994ccc2d49c',
      18,
      'cZRX',
      'Compound 0x',
      'ZRX',
      '0x',
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xE41d2489571d322189246DaFA5ebDe1F4699F498/logo.png',
      ''
    ]
  ],
  [ChainId.RINKEBY]: [
    [
      '0xEBf1A11532b93a529b5bC942B4bAA98647913002',
      '0xbF7A7169562078c96f0eC1A8aFD6aE50f12e5A99',
      18,
      'cBAT',
      'Compound BAT',
      'BAT',
      'Basic Attention Token',
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x0D8775F648430679A709E98d2b0Cb6250d2887EF/logo.png',
      ''
    ],
    [
      '0x6D7F0754FFeb405d23C51CE938289d4835bE3b14',
      '0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa',
      18,
      'cDAI',
      'Compound DAI',
      'DAI',
      'Dai Stablecoin',
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
      ''
    ],
    [
      '0xd6801a1DfFCd0a410336Ef88DeF4320D6DF1883e',
      '0xc778417E063141139Fce010982780140Aa0cD5Ab',
      18,
      'cETH',
      'Compound ETH',
      'ETH',
      'Ether',
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      ''
    ],
    [
      '0x5B281A6DdA0B271e91ae35DE655Ad301C976edb1',
      '0x4DBCdF9B62e891a7cec5A2568C3F4FAF9E8Abe2b',
      6,
      'cUSDC',
      'Compound USDC',
      'USDC',
      'USD Coin',
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
      ''
    ],
    [
      '0x2fB298BDbeF468638AD6653FF8376575ea41e768',
      '0xD9BA894E0097f8cC2BBc9D24D308b98e36dc6D02',
      18,
      'cUSDT',
      'Compound USDT',
      'USDT',
      'Tether USD',
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
      ''
    ],
    [
      '0x0014F450B8Ae7708593F4A46F8fa6E5D50620F96',
      '0xc778417E063141139Fce010982780140Aa0cD5Ab',
      18,
      'cWBTC',
      'Compound WBTC',
      'WBTC',
      'Wrapped BTC',
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png',
      ''
    ],
    [
      '0x52201ff1720134bBbBB2f6BC97Bf3715490EC19B',
      '0xddea378A6dDC8AfeC82C36E9b0078826bf9e68B6',
      18,
      'cZRX',
      'Compound 0x',
      'ZRX',
      '0x',
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xE41d2489571d322189246DaFA5ebDe1F4699F498/logo.png',
      ''
    ]
  ],
  [ChainId.GÖRLI]: [
    [
      '0xccaf265e7492c0d9b7c2f0018bf6382ba7f0148d',
      '0x70cba46d2e933030e2f274ae58c951c800548aef',
      18,
      'cBAT',
      'Compound BAT',
      'BAT',
      'BAT',
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x0D8775F648430679A709E98d2b0Cb6250d2887EF/logo.png',
      ''
    ],
    [
      '0x822397d9a55d0fefd20f5c4bcab33c5f65bd28eb',
      '0xdc31ee1784292379fbb2964b3b9c4124d8f89c60',
      18,
      'cDAI',
      'Compound DAI',
      'DAI',
      'Dai Stablecoin',
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
      ''
    ],
    [
      '0x20572e4c090f15667cf7378e16fad2ea0e2f3eff',
      '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
      18,
      'cETH',
      'Compound ETH',
      'ETH',
      'Ether',
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      ''
    ],
    [
      '0xcec4a43ebb02f9b80916f1c718338169d6d5c1f0',
      '0xd87ba7a50b2e7e660f678a895e4b72e7cb4ccd9c',
      6,
      'cUSDC',
      'Compound USDC',
      'USDC',
      'USD Coin',
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
      ''
    ],
    [
      '0x6ce27497a64fffb5517aa4aee908b1e7eb63b9ff',
      '0xc04b0d3107736c32e19f1c62b2af67be61d63a05',
      8,
      'cWBTC',
      'Compound WBTC',
      'WBTC',
      'Wrapped BTC',
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png',
      ''
    ],
    [
      '0xa253295ec2157b8b69c44b2cb35360016daa25b1',
      '0xe4e81fa6b16327d4b78cfeb83aade04ba7075165',
      18,
      'cZRX',
      'Compound ZRX',
      'ZRX',
      '0x',
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xE41d2489571d322189246DaFA5ebDe1F4699F498/logo.png',
      ''
    ]
  ],
  [ChainId.KOVAN]: [
    [
      '0x41b5844f4680a8c38fbb695b7f9cfd1f64474a72',
      '0xd0A1E359811322d97991E03f863a0C30C2cF029C',
      18,
      'cETH',
      'Compound ETH',
      'ETH',
      'Ether',
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      ''
    ],
    [
      '0x4a77faee9650b09849ff459ea1476eab01606c7a',
      '0x482dC9bB08111CB875109B075A40881E48aE02Cd',
      18,
      'cBAT',
      'Compound BAT',
      'BAT',
      'Basic Attention Token',
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x0D8775F648430679A709E98d2b0Cb6250d2887EF/logo.png',
      ''
    ],
    [
      '0x4a92e71227d294f041bd82dd8f78591b75140d63',
      '0xb7a4F3E9097C08dA09517b5aB877F7a917224ede',
      6,
      'cUSDC',
      'Compound USDC',
      'USDC',
      'USD Coin',
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
      ''
    ],
    [
      '0xf0d0eb522cfa50b716b3b1604c4f0fa6f04376ad',
      '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa',
      18,
      'cDAI',
      'Compound DAI',
      'DAI',
      'Dai Stablecoin',
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
      ''
    ],
    [
      '0x3f0a0ea2f86bae6362cf9799b523ba06647da018',
      '0x07de306FF27a2B630B1141956844eB1552B956B5',
      6,
      'cUSDT',
      'Compound USDT',
      'USDT',
      'Tether USD',
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
      ''
    ],
    [
      '0xa1faa15655b0e7b6b6470ed3d096390e6ad93abb',
      '0xd3A691C852CDB01E281545A27064741F0B7f6825',
      8,
      'cWBTC',
      'Compound WBTC',
      'WBTC',
      'Wrapped BTC',
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png',
      ''
    ],
    [
      '0xaf45ae737514c8427d373d50cd979a242ec59e5a',
      '0x162c44e53097e7B5aaE939b297ffFD6Bf90D1EE3',
      18,
      'cZRX',
      'Compound ZRX',
      'ZRX',
      '0x Protocol Token',
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xE41d2489571d322189246DaFA5ebDe1F4699F498/logo.png',
      ''
    ]
  ]
}

const COMPTROLLER_INTERFACE = new Interface(COMPTROLLER_ABI)
const CHAINLINK_PRICE_ORACLE_PROXY = new Interface(CHAINLINK_PRICE_ORACLE_PROXY_ABI)

export {
  COMPTROLLER_ADDRESSES,
  ORACLE_ADDRESSES,
  MAXIMILLION_ADDRESSES,
  CTOKEN_LISTS,
  COMPTROLLER_INTERFACE,
  CHAINLINK_PRICE_ORACLE_PROXY,
  COMPTROLLER_ABI,
  CHAINLINK_PRICE_ORACLE_PROXY_ABI
}

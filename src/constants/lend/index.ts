import { Interface } from '@ethersproject/abi'
import { ChainId } from '@uniswap/sdk'
import COMPTROLLER_ABI from './comptroller.json'
import CHAINLINK_PRICE_ORACLE_PROXY_ABI from './chainlink_price_oracle_proxy.json'

const COMPTROLLER_ADDRESSES: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
  [ChainId.ROPSTEN]: '0x54188bbedd7b68228fa89cbdda5e3e930459c6c6',
  [ChainId.RINKEBY]: '0x2eaa9d77ae4d8f9cdd9faacd44016e746485bddb',
  [ChainId.GÖRLI]: '0x627ea49279fd0de89186a58b8758ad02b6be2867',
  [ChainId.KOVAN]: '0x5eae89dc1c671724a672ff0630122ee834098657'
}

const ORACLE_ADDRESSES: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: '0x922018674c12a7f0d394ebeef9b58f186cde13c1',
  [ChainId.ROPSTEN]: '0xb2b3d5b4e35881d518fa2062325f118a6ebb6c4a',
  [ChainId.RINKEBY]: '0xD2B1eCa822550d9358e97e72c6C1a93AE28408d0', // not working due to lack of oracle
  [ChainId.GÖRLI]: '0x9A536Ed5C97686988F93C9f7C2A390bF3B59c0ec', // not working due to lack of oracle
  [ChainId.KOVAN]: '0xbBdE93962Ca9fe39537eeA7380550ca6845F8db7'
}

const CTOKEN_LISTS: { [chainId in ChainId]: [string, string, number, string, string, string, string][] } = {
  [ChainId.MAINNET]: [
    [
      '0x6c8c6b02e7b2be14d4fa6022dfd6d75921d90e4e',
      '0x0D8775F648430679A709E98d2b0Cb6250d2887EF',
      18,
      'cBAT',
      'Compound Basic Attention Token',
      'BAT',
      'BAT'
    ],
    [
      '0x70e36f6bf80a52b3b46b3af8e106cc0ed743e8e4',
      '0xc00e94Cb662C3520282E6f5717214004A7f26888',
      18,
      'cCOMP',
      'Compound Collateral',
      'COMP',
      'Compound'
    ],
    [
      '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643',
      '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      18,
      'cDAI',
      'Compound DAI',
      'DAI',
      'Dai Stablecoin'
    ],
    [
      '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5',
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      18,
      'cETH',
      'Compound ETH',
      'ETH',
      'Ether'
    ],
    [
      '0x35a18000230da775cac24873d00ff85bccded550',
      '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      18,
      'cUNI',
      'Compound UNI',
      'UNI',
      'Uniswap'
    ],
    [
      '0x39aa39c021dfbae8fac545936693ac917d5e7563',
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      6,
      'cUSDC',
      'Compound USDC',
      'USDC',
      'USD Coin'
    ],
    [
      '0xf650c3d88d12db855b8bf7d11be6c55a4e07dcc9',
      '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      6,
      'cUSDT',
      'Compound USDT',
      'USDT',
      'Tether USD'
    ],
    [
      '0xc11b1268c1a384e55c48c2391d8d480264a3a7f4',
      '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      8,
      'cWBTC',
      'Compound WBTC',
      'WBTC',
      'Wrapped BTC'
    ],
    [
      '0xb3319f5d18bc0d84dd1b4825dcde5d5f7266d407',
      '0xE41d2489571d322189246DaFA5ebDe1F4699F498',
      18,
      'cZRX',
      'Compound 0x',
      'ZRX',
      '0x'
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
      'Basic Attention Token'
    ],
    [
      '0x8354c3a332ffb24e3a27be252e01acfe65a33b35',
      '0x31f42841c2db5173425b5223809cf3a38fede360',
      18,
      'cDAI',
      'Compound DAI',
      'DAI',
      'Dai Stablecoin'
    ],
    [
      '0xbe839b6d93e3ea47effcca1f27841c917a8794f3',
      '0xc778417E063141139Fce010982780140Aa0cD5Ab',
      18,
      'cETH',
      'Compound ETH',
      'ETH',
      'Ether'
    ],
    [
      '0x22531f0f3a9c36bfc3b04c4c60df5168a1cfcec3',
      '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
      18,
      'cUNI',
      'Compound UNI',
      'UNI',
      'Uniswap'
    ],
    [
      '0x8af93cae804cc220d1a608d4fa54d1b6ca5eb361',
      '0x0d9c8723b343a8368bebe0b5e89273ff8d712e3c',
      6,
      'cUSDC',
      'Compound USDC',
      'USDC',
      'USD Coin'
    ],
    [
      '0x135669c2dcbd63f639582b313883f101a4497f76',
      '0x516de3a7a567d81737e3a46ec4ff9cfd1fcb0136',
      6,
      'cUSDT',
      'Compound USDT',
      'USDT',
      'Tether USD'
    ],
    [
      '0x58145bc5407d63daf226e4870beeb744c588f149',
      '0xbde8bb00a7ef67007a96945b3a3621177b615c44',
      8,
      'cWBTC',
      'Compound WBTC',
      'WBTC',
      'Wrapped BTC'
    ],
    [
      '0x00e02a5200ce3d5b5743f5369deb897946c88121',
      '0xe4c6182ea459e63b8f1be7c428381994ccc2d49c',
      18,
      'cZRX',
      'Compound 0x',
      'ZRX',
      '0x'
    ]
  ],
  [ChainId.RINKEBY]: [
    [
      '0xebf1a11532b93a529b5bc942b4baa98647913002',
      '0xbf7a7169562078c96f0ec1a8afd6ae50f12e5a99',
      18,
      'cBAT',
      'Compound BAT',
      'BAT',
      'BAT'
    ],
    [
      '0x6d7f0754ffeb405d23c51ce938289d4835be3b14',
      '0x5592ec0cfb4dbc12d3ab100b257153436a1f0fea',
      18,
      'cDAI',
      'Compound DAI',
      'DAI',
      'Dai Stablecoin'
    ],
    [
      '0xd6801a1dffcd0a410336ef88def4320d6df1883e',
      '0xc778417E063141139Fce010982780140Aa0cD5Ab',
      18,
      'cETH',
      'Compound ETH',
      'ETH',
      'Ether'
    ],
    [
      '0x5b281a6dda0b271e91ae35de655ad301c976edb1',
      '0x4dbcdf9b62e891a7cec5a2568c3f4faf9e8abe2b',
      6,
      'cUSDC',
      'Compound USDC',
      'USDC',
      'USD Coin'
    ],
    [
      '0x2fb298bdbef468638ad6653ff8376575ea41e768',
      '0xd9ba894e0097f8cc2bbc9d24d308b98e36dc6d02',
      6,
      'cUSDT',
      'Compound USDT',
      'USDT',
      'Tether USD'
    ],
    [
      '0x0014f450b8ae7708593f4a46f8fa6e5d50620f96',
      '0x577d296678535e4903d59a4c929b718e1d575e0a',
      8,
      'cWBTC',
      'Compound WBTC',
      'WBTC',
      'Wrapped BTC'
    ],
    [
      '0x52201ff1720134bbbbb2f6bc97bf3715490ec19b',
      '0xddea378a6ddc8afec82c36e9b0078826bf9e68b6',
      18,
      'cZRX',
      'Compound 0x',
      'ZRX',
      '0x'
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
      'BAT'
    ],
    [
      '0x822397d9a55d0fefd20f5c4bcab33c5f65bd28eb',
      '0xdc31ee1784292379fbb2964b3b9c4124d8f89c60',
      18,
      'cDAI',
      'Compound DAI',
      'DAI',
      'Dai Stablecoin'
    ],
    [
      '0x20572e4c090f15667cf7378e16fad2ea0e2f3eff',
      '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
      18,
      'cETH',
      'Compound ETH',
      'ETH',
      'Ether'
    ],
    [
      '0xcec4a43ebb02f9b80916f1c718338169d6d5c1f0',
      '0xd87ba7a50b2e7e660f678a895e4b72e7cb4ccd9c',
      6,
      'cUSDC',
      'Compound USDC',
      'USDC',
      'USD Coin'
    ],
    [
      '0x6ce27497a64fffb5517aa4aee908b1e7eb63b9ff',
      '0xc04b0d3107736c32e19f1c62b2af67be61d63a05',
      8,
      'cWBTC',
      'Compound WBTC',
      'WBTC',
      'Wrapped BTC'
    ],
    [
      '0xa253295ec2157b8b69c44b2cb35360016daa25b1',
      '0xe4e81fa6b16327d4b78cfeb83aade04ba7075165',
      18,
      'cZRX',
      'Compound ZRX',
      'ZRX',
      '0x'
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
      'Ether'
    ],
    [
      '0x4a77faee9650b09849ff459ea1476eab01606c7a',
      '0x482dC9bB08111CB875109B075A40881E48aE02Cd',
      18,
      'cBAT',
      'Compound BAT',
      'BAT',
      'Basic Attention Token'
    ],
    [
      '0x4a92e71227d294f041bd82dd8f78591b75140d63',
      '0xb7a4F3E9097C08dA09517b5aB877F7a917224ede',
      6,
      'cUSDC',
      'Compound USDC',
      'USDC',
      'USD Coin'
    ],
    [
      '0xf0d0eb522cfa50b716b3b1604c4f0fa6f04376ad',
      '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa',
      18,
      'cDAI',
      'Compound DAI',
      'DAI',
      'Dai Stablecoin'
    ],
    [
      '0x3f0a0ea2f86bae6362cf9799b523ba06647da018',
      '0x07de306FF27a2B630B1141956844eB1552B956B5',
      6,
      'cUSDT',
      'Compound USDT',
      'USDT',
      'Tether USD'
    ],
    [
      '0xa1faa15655b0e7b6b6470ed3d096390e6ad93abb',
      '0xd3A691C852CDB01E281545A27064741F0B7f6825',
      8,
      'cWBTC',
      'Compound WBTC',
      'WBTC',
      'Wrapped BTC'
    ],
    [
      '0xaf45ae737514c8427d373d50cd979a242ec59e5a',
      '0x162c44e53097e7B5aaE939b297ffFD6Bf90D1EE3',
      18,
      'cZRX',
      'Compound ZRX',
      'ZRX',
      '0x Protocol Token'
    ]
  ]
}

const COMPTROLLER_INTERFACE = new Interface(COMPTROLLER_ABI)
const CHAINLINK_PRICE_ORACLE_PROXY = new Interface(CHAINLINK_PRICE_ORACLE_PROXY_ABI)

export {
  COMPTROLLER_ADDRESSES,
  ORACLE_ADDRESSES,
  CTOKEN_LISTS,
  COMPTROLLER_INTERFACE,
  CHAINLINK_PRICE_ORACLE_PROXY,
  COMPTROLLER_ABI,
  CHAINLINK_PRICE_ORACLE_PROXY_ABI
}

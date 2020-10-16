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
  [ChainId.MAINNET]: '0x0000000000000000000000000000000000000000',
  [ChainId.ROPSTEN]: '0x0000000000000000000000000000000000000000',
  [ChainId.RINKEBY]: '0x0000000000000000000000000000000000000000',
  [ChainId.GÖRLI]: '0x0000000000000000000000000000000000000000',
  [ChainId.KOVAN]: '0xbBdE93962Ca9fe39537eeA7380550ca6845F8db7'
}

const CTOKEN_LISTS: { [chainId in ChainId]: [string, string, number, string, string, string, string][] } = {
  [ChainId.MAINNET]: [],
  [ChainId.ROPSTEN]: [],
  [ChainId.RINKEBY]: [],
  [ChainId.GÖRLI]: [],
  [ChainId.KOVAN]: [
    [
      '0x4a77faee9650b09849ff459ea1476eab01606c7a',
      '0x482dC9bB08111CB875109B075A40881E48aE02Cd',
      18,
      'cBAT',
      'Compound BAT',
      'BAT',
      'Basic Attention Token'
    ], // bat
    [
      '0x4a92e71227d294f041bd82dd8f78591b75140d63',
      '0xb7a4F3E9097C08dA09517b5aB877F7a917224ede',
      6,
      'cUSDC',
      'Compound USDC',
      'USDC',
      'USD Coin'
    ], // usdc
    [
      '0x41b5844f4680a8c38fbb695b7f9cfd1f64474a72',
      '0xd0A1E359811322d97991E03f863a0C30C2cF029C',
      18,
      'cETH',
      'Compound ETH',
      'WETH',
      'Wrapped Ether'
    ], // eth
    [
      '0xA4eC170599a1Cf87240a35b9B1B8Ff823f448b57',
      '0x50DD65531676F718B018De3dc48F92B53D756996',
      18,
      'cREP',
      'Compound REP',
      'REP',
      'Augur'
    ] // rep
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

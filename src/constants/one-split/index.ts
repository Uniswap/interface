import { Interface } from '@ethersproject/abi'
import { ChainId, JSBI } from '@uniswap/sdk'
import ONE_SPLIT_ABI from './one_split.json'

const FLAG_DISABLE_ALL_SPLIT_SOURCES = 0x20000000
const FLAG_DISABLE_MOONISWAP = 0x1000000

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
const bn1e18 = JSBI.BigInt("1000000000000000000")

const ONE_SPLIT_ADDRESSES: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: '0xC586BeF4a0992C495Cf22e1aeEE4E446CECDee0E',
  [ChainId.ROPSTEN]: '',
  [ChainId.RINKEBY]: '',
  [ChainId.GÖRLI]: '',
  [ChainId.KOVAN]: ''
}

const ONE_SPLIT_ABI_INTERFACE = new Interface(ONE_SPLIT_ABI)

export {
  ONE_SPLIT_ABI_INTERFACE,
  ONE_SPLIT_ABI,
  ONE_SPLIT_ADDRESSES,
  FLAG_DISABLE_ALL_SPLIT_SOURCES,
  FLAG_DISABLE_MOONISWAP,
  ZERO_ADDRESS,
  ETH_ADDRESS,
  bn1e18
}

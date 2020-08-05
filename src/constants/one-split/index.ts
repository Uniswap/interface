import { Interface } from '@ethersproject/abi'
import { ChainId } from '@uniswap/sdk'
import ONE_SPLIT_ABI from './one_split.json'

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
  ONE_SPLIT_ADDRESSES
}

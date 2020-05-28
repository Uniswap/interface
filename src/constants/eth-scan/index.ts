import { ChainId } from '@uniswap/sdk'
import ETH_SCAN_ABI from './abi.json'

const ETH_SCAN_NETWORKS: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: '0x86f25b64e1fe4c5162cdeed5245575d32ec549db',
  [ChainId.ROPSTEN]: '0x86f25b64e1fe4c5162cdeed5245575d32ec549db',
  [ChainId.KOVAN]: '0x86f25b64e1fe4c5162cdeed5245575d32ec549db',
  [ChainId.RINKEBY]: '0x86f25b64e1fe4c5162cdeed5245575d32ec549db',
  [ChainId.GÖRLI]: '0x86f25b64e1fe4c5162cdeed5245575d32ec549db'
}

export { ETH_SCAN_ABI, ETH_SCAN_NETWORKS }

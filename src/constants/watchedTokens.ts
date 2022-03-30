import { NATIVE_ADDRESS } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { UNI, USDC } from 'src/constants/tokens'

export const DEFAULT_WATCHED_TOKENS = {
  [ChainId.Mainnet]: {
    [NATIVE_ADDRESS]: true, // Native Eth
    [USDC.address]: true,
    [UNI[ChainId.Mainnet].address]: true,
  },
  [ChainId.Goerli]: {
    [NATIVE_ADDRESS]: true, // Native Eth
    [UNI[ChainId.Goerli].address]: true,
  },
  [ChainId.Rinkeby]: {
    [NATIVE_ADDRESS]: true, // Native Eth
    [UNI[ChainId.Rinkeby].address]: true,
  },
}

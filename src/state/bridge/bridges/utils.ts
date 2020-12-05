import { ETHER as FUSE } from '@fuseio/fuse-swap-sdk'
import { BridgeMode } from './tokenBridge'
import { isNativeOrErc677ToErc677BridgeToken } from '../../../utils'

const isNative = (tokenAddress: string): boolean => {
  return tokenAddress === FUSE.symbol
}

export const getBridgeMode = (tokenAddress: string): BridgeMode => {
  if (isNative(tokenAddress)) {
    return BridgeMode.NATIVE_TO_ERC
  } else if (isNativeOrErc677ToErc677BridgeToken(tokenAddress)) {
    return BridgeMode.ERC677_TO_ERC677
  } else {
    return BridgeMode.ERC20_TO_ERC677
  }
}

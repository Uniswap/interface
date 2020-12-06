import { ETHER as FUSE } from '@fuseio/fuse-swap-sdk'
import { BridgeMode } from './tokenBridge'
import { isCustomBridgeToken } from '../../../utils'

const isNative = (tokenAddress: string): boolean => {
  return tokenAddress === FUSE.symbol
}

export const getBridgeMode = (tokenAddress: string): BridgeMode => {
  if (isNative(tokenAddress)) {
    return BridgeMode.NATIVE_TO_ERC
  } else if (isCustomBridgeToken(tokenAddress)) {
    return BridgeMode.ERC677_TO_ERC677
  } else {
    return BridgeMode.ERC20_TO_ERC677
  }
}

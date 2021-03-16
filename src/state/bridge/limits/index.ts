import { Web3Provider } from '@ethersproject/providers'
import { getBridgeType } from '../../../utils'
import { BridgeDirection, BridgeType } from '../hooks'
import ethFuseNativeToErcMinMax from './ethFuse/native'
import ethFuseErc20ToErc677MinMax from './ethFuse/erc20ToErc677'
import ethFuseErc677ToErc677MinMax from './ethFuse/erc677ToErc677'
import bnbFuseErc20ToErc677MinMax from './bnbFuse/erc20ToErc677'

export async function getMinMaxPerTxn(
  tokenAddress: string,
  bridgeDirection: BridgeDirection,
  decimals: number | undefined,
  isHome: boolean,
  library: Web3Provider,
  account: string
) {
  let getMinMax: (...args: any[]) => Promise<any>, args: Array<any>

  const bridgeType = getBridgeType(tokenAddress, bridgeDirection)
  switch (bridgeType) {
    case BridgeType.ETH_FUSE_NATIVE:
      getMinMax = ethFuseNativeToErcMinMax
      args = [decimals, isHome, library, account]
      break
    case BridgeType.ETH_FUSE_ERC20_TO_ERC677:
      getMinMax = ethFuseErc20ToErc677MinMax
      args = [tokenAddress, decimals, isHome, library, account]
      break
    case BridgeType.ETH_FUSE_ERC677_TO_ERC677:
      getMinMax = ethFuseErc677ToErc677MinMax
      args = [decimals, isHome, library, account]
      break
    case BridgeType.BSC_FUSE_ERC20_TO_ERC677:
      getMinMax = bnbFuseErc20ToErc677MinMax
      args = [tokenAddress, decimals, isHome, library, account]
      break
    default:
      throw new Error(`Unsupported bridge type`)
  }

  const result = await getMinMax(...args)
  return result
}

import { Web3Provider } from '@ethersproject/providers'
import {
  getHomeBridgeNativeToErcContract,
  tryFormatAmount,
  getForeignBridgeNativeToErcContract
} from '../../../../utils'
import { Contract } from 'ethers'
import {
  BSC_NATIVE_TO_ERC677_BRIDGE_HOME_ADDRESS,
  BSC_NATIVE_TO_ERC677_BRIDGE_FOREIGN_ADDRESS
} from '../../../../constants'

export default async function getNativeToErcMinMax(
  decimals: number | undefined,
  isHome: boolean,
  library: Web3Provider,
  account: string
) {
  let contract: Contract

  if (isHome) {
    contract = getHomeBridgeNativeToErcContract(BSC_NATIVE_TO_ERC677_BRIDGE_HOME_ADDRESS, library, account)
  } else {
    contract = getForeignBridgeNativeToErcContract(BSC_NATIVE_TO_ERC677_BRIDGE_FOREIGN_ADDRESS, library, account)
  }

  const min = await contract.minPerTx()
  const max = await contract.maxPerTx()

  return { minAmount: tryFormatAmount(min, decimals), maxAmount: tryFormatAmount(max, decimals) }
}

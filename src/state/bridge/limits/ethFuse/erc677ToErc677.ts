import { Web3Provider } from '@ethersproject/providers'
import { getAMBErc677To677Contract, tryFormatAmount } from '../../../../utils'
import {
  FUSE_ERC677_TO_ERC677_BRIDGE_HOME_ADDRESS,
  FUSE_ERC677_TO_ERC677_BRIDGE_FOREIGN_ADDRESS
} from '../../../../constants'

export default async function getErc677ToErc677MinMax(
  decimals: number | undefined,
  isHome: boolean,
  library: Web3Provider,
  account: string
) {
  const address = isHome ? FUSE_ERC677_TO_ERC677_BRIDGE_HOME_ADDRESS : FUSE_ERC677_TO_ERC677_BRIDGE_FOREIGN_ADDRESS

  const contract = getAMBErc677To677Contract(address, library, account)
  const min = await contract.minPerTx()
  const max = await contract.maxPerTx()

  return { minAmount: tryFormatAmount(min, decimals), maxAmount: tryFormatAmount(max, decimals) }
}

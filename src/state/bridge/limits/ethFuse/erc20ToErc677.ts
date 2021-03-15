import { Web3Provider } from '@ethersproject/providers'
import {
  getHomeMultiAMBErc20ToErc677Contract,
  tryFormatAmount,
  getForeignMultiAMBErc20ToErc677Contract
} from '../../../../utils'
import { Contract, constants } from 'ethers'
import {
  FUSE_ERC20_TO_ERC677_BRIDGE_HOME_ADDRESS,
  FUSE_ERC20_TO_ERC677_BRIDGE_FOREIGN_ADDRESS
} from '../../../../constants'

export default async function getErc20ToErc677MinMax(
  tokenAddress: string,
  decimals: number | undefined,
  isHome: boolean,
  library: Web3Provider,
  account: string
) {
  let contract: Contract

  if (isHome) {
    contract = getHomeMultiAMBErc20ToErc677Contract(FUSE_ERC20_TO_ERC677_BRIDGE_HOME_ADDRESS, library, account)
  } else {
    contract = getForeignMultiAMBErc20ToErc677Contract(FUSE_ERC20_TO_ERC677_BRIDGE_FOREIGN_ADDRESS, library, account)
  }

  const min = await contract.minPerTx(tokenAddress)

  let max = await contract.maxPerTx(tokenAddress)
  if (tryFormatAmount(max, decimals) === '0.0') {
    max = await contract.maxPerTx(constants.AddressZero)
  }

  return { minAmount: tryFormatAmount(min, decimals), maxAmount: tryFormatAmount(max, decimals) }
}

import { Web3Provider } from '@ethersproject/providers'
import {
  getHomeMultiAMBErc20ToErc677Contract,
  tryFormatAmount,
  getForeignMultiAMBErc20ToErc677Contract
} from '../../../../utils'
import {
  BINANCE_ERC20_TO_ERC677_HOME_BRIDGE_ADDRESS,
  BINANCE_ERC20_TO_ERC677_FOREIGN_BRIDGE_ADDRESS
} from '../../../../constants'
import { Contract, constants } from 'ethers'

export default async function getErc20ToErc677MinMax(
  tokenAddress: string,
  decimals: number | undefined,
  isHome: boolean,
  library: Web3Provider,
  account: string
) {
  let contract: Contract

  if (isHome) {
    contract = getHomeMultiAMBErc20ToErc677Contract(BINANCE_ERC20_TO_ERC677_HOME_BRIDGE_ADDRESS, library, account)
  } else {
    contract = getForeignMultiAMBErc20ToErc677Contract(BINANCE_ERC20_TO_ERC677_FOREIGN_BRIDGE_ADDRESS, library, account)
  }

  const min = await contract.minPerTx(tokenAddress)

  let max = await contract.maxPerTx(tokenAddress)
  if (tryFormatAmount(max, decimals) === '0.0') {
    max = await contract.maxPerTx(constants.AddressZero)
  }

  return { minAmount: tryFormatAmount(min, decimals), maxAmount: tryFormatAmount(max, decimals) }
}

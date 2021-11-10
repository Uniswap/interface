import { BigNumber, BigNumberish, FixedNumber, utils } from 'ethers'

export function gweiToWei(gweiAmount: number): BigNumber {
  return utils.parseUnits(gweiAmount.toFixed(9), 'gwei')
}

export function weiToGwei(weiAmount: BigNumberish): number {
  if (!weiAmount) return 0
  return FixedNumber.from(utils.formatUnits(weiAmount, 'gwei')).toUnsafeFloat()
}

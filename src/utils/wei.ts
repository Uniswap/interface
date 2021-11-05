import { BigNumberish, utils } from 'ethers'

export function gweiToWei(gweiAmount: string) {
  return utils.parseUnits(gweiAmount, 'gwei')
}

export function weiToGwei(weiAmount: BigNumberish) {
  if (!weiAmount) return '0'
  return utils.formatUnits(weiAmount, 'gwei')
}

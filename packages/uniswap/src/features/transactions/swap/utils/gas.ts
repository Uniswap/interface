import { BigNumber } from 'ethers/lib/ethers'

export function sumGasFees(gasFee1?: string | undefined, gasFee2?: string): string | undefined {
  if (!gasFee1 || !gasFee2) {
    return gasFee1 || gasFee2
  }

  return BigNumber.from(gasFee1).add(gasFee2).toString()
}

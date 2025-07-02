import { BigNumber } from 'ethers'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'

export interface GasFeeData {
  chainId: number
  gasFeeDisplayValue?: string
}

export interface GroupedGasFee {
  currency: NativeCurrency
  totalFeeAmountInWei: string
  chainIds: number[]
}

export function groupGasFeesBySymbol(gasFees: GasFeeData[]): Record<string, GroupedGasFee> {
  return gasFees.reduce(
    (acc, { chainId, gasFeeDisplayValue }) => {
      if (!gasFeeDisplayValue) {
        return acc
      }
      const currency = NativeCurrency.onChain(chainId)

      const symbol = currency.symbol
      if (!acc[symbol]) {
        acc[symbol] = {
          currency,
          totalFeeAmountInWei: gasFeeDisplayValue,
          chainIds: [chainId],
        }
      } else if (symbol in acc) {
        const existing = acc[symbol]
        if (existing) {
          existing.totalFeeAmountInWei = BigNumber.from(existing.totalFeeAmountInWei).add(gasFeeDisplayValue).toString()
          existing.chainIds.push(chainId)
        }
      }

      return acc
    },
    {} as Record<string, GroupedGasFee>,
  )
}

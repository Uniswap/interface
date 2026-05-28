import { Currency } from '@uniswap/sdk-core'
import { BigNumber } from 'ethers'
import { nativeOnChain } from 'uniswap/src/constants/tokens'

export interface GasFeeData {
  chainId: number
  gasFeeDisplayValue?: string
}

export interface GroupedGasFee {
  currency: Currency
  totalFeeAmountInWei: string
  chainIds: number[]
}

export function groupGasFeesBySymbol(gasFees: GasFeeData[]): Record<string, GroupedGasFee> {
  return gasFees.reduce(
    (acc, { chainId, gasFeeDisplayValue }) => {
      if (!gasFeeDisplayValue) {
        return acc
      }
      const currency = nativeOnChain(chainId)

      const symbol = currency.symbol
      if (!symbol) {
        return acc
      }

      if (!acc[symbol]) {
        acc[symbol] = {
          currency,
          totalFeeAmountInWei: gasFeeDisplayValue,
          chainIds: [chainId],
        }
      } else if (symbol in acc) {
        const existing = acc[symbol]
        existing.totalFeeAmountInWei = BigNumber.from(existing.totalFeeAmountInWei).add(gasFeeDisplayValue).toString()
        existing.chainIds.push(chainId)
      }

      return acc
    },
    {} as Record<string, GroupedGasFee>,
  )
}

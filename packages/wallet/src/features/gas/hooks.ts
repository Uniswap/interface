import { providers } from 'ethers'
import { useMemo } from 'react'
import { ChainId } from 'wallet/src/constants/chains'
import { useGasFeeQuery } from 'wallet/src/features/gas/api'
import { FeeType, GasSpeed, UseTransactionGasFeeResponse } from 'wallet/src/features/gas/types'
import { useUSDCValue } from 'wallet/src/features/routing/useUSDCPrice'
import { NativeCurrency } from 'wallet/src/features/tokens/NativeCurrency'
import { getCurrencyAmount, ValueType } from 'wallet/src/utils/getCurrencyAmount'

export function useTransactionGasFee(
  tx: Maybe<providers.TransactionRequest>,
  speed: GasSpeed = GasSpeed.Urgent,
  skip?: boolean
): UseTransactionGasFeeResponse {
  const { data, error } = useGasFeeQuery(tx, skip)

  return useMemo(() => {
    if (!data) return { error }

    const params =
      data.type === FeeType.Eip1559
        ? {
            maxPriorityFeePerGas: data.maxPriorityFeePerGas[speed],
            maxFeePerGas: data.maxFeePerGas[speed],
            gasLimit: data.gasLimit,
          }
        : {
            gasPrice: data.gasPrice[speed],
            gasLimit: data.gasLimit,
          }

    return {
      data: {
        type: data.type,
        speed,
        gasFee: data.gasFee[speed],
        params,
      },
    }
  }, [data, error, speed])
}

export function useUSDValue(chainId?: ChainId, ethValueInWei?: string): string | undefined {
  const currencyAmount = getCurrencyAmount({
    value: ethValueInWei,
    valueType: ValueType.Raw,
    currency: chainId ? NativeCurrency.onChain(chainId) : undefined,
  })

  return useUSDCValue(currencyAmount)?.toExact()
}

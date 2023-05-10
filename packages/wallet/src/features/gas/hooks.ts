import { skipToken } from '@reduxjs/toolkit/dist/query'
import { providers } from 'ethers'
import { useMemo } from 'react'
import { getPollingIntervalByBlocktime } from 'wallet/src/features/chains/chainIdUtils'
import { useGasFeeQuery } from 'wallet/src/features/gas/gasApi'
import { FeeType, GasSpeed, TransactionGasFeeInfo } from 'wallet/src/features/gas/types'

export function useTransactionGasFee(
  tx: providers.TransactionRequest | undefined | null,
  speed: GasSpeed = GasSpeed.Urgent,
  skip?: boolean
): TransactionGasFeeInfo | undefined {
  // TODO: [MOB-3889] Handle error responses from gas endpoint
  const { data } = useGasFeeQuery((!skip && tx) || skipToken, {
    pollingInterval: getPollingIntervalByBlocktime(tx?.chainId),
  })

  return useMemo(() => {
    if (!data) return undefined

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
      type: data.type,
      speed,
      gasFee: data.gasFee[speed],
      params,
    }
  }, [data, speed])
}

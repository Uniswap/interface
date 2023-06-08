import { providers } from 'ethers'
import { useMemo } from 'react'
import { useGasFeeQuery } from 'wallet/src/features/gas/api'
import { FeeType, GasSpeed, TransactionGasFeeInfo } from 'wallet/src/features/gas/types'

export function useTransactionGasFee(
  tx: Maybe<providers.TransactionRequest>,
  speed: GasSpeed = GasSpeed.Urgent,
  skip?: boolean
): TransactionGasFeeInfo | undefined {
  // TODO: [MOB-650] Handle error responses from gas endpoint
  const { data } = useGasFeeQuery(tx, skip)

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

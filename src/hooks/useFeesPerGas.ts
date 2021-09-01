import { useMemo } from 'react'
import { BigNumber } from '@ethersproject/bignumber'
import { usePrivateTransactionFees } from 'state/application/hooks'

type FeesReturnType = {
  maxFeePerGas: BigNumber | undefined
  maxPriorityFeePerGas: BigNumber | undefined
}

export default function useFeesPerGas(): FeesReturnType {
  const fees = usePrivateTransactionFees()

  return useMemo(() => {
    const ret: FeesReturnType = {
      maxFeePerGas: undefined,
      maxPriorityFeePerGas: undefined,
    }

    if (fees) {
      ret.maxFeePerGas = BigNumber.from(fees.default.maxFeePerGas)
      ret.maxPriorityFeePerGas = BigNumber.from(fees.default.maxPriorityFeePerGas)
    }
    return ret
  }, [fees])
}

import { useMemo } from 'react'
import { BigNumber } from '@ethersproject/bignumber'
import { usePrivateTransactionFees } from 'state/application/hooks'
import { useFrontrunningProtectionGasFee, useFrontrunningProtection } from 'state/user/hooks'

type FeesReturnType = {
  maxFeePerGas: BigNumber | undefined
  maxPriorityFeePerGas: BigNumber | undefined
}

export default function useFeesPerGas(): FeesReturnType {
  const fees = usePrivateTransactionFees()
  const setting = useFrontrunningProtectionGasFee()
  const frontrunningProtection = useFrontrunningProtection()
  return useMemo(() => {
    const ret: FeesReturnType = {
      maxFeePerGas: undefined,
      maxPriorityFeePerGas: undefined,
    }
    if (!frontrunningProtection) return ret
    if (fees && setting) {
      ret.maxFeePerGas = BigNumber.from(fees[setting].maxFeePerGas)
      ret.maxPriorityFeePerGas = BigNumber.from(fees[setting].maxPriorityFeePerGas)
    }
    return ret
  }, [fees, setting, frontrunningProtection])
}

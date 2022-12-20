import { Address } from '@celo/contractkit'
import { RomulusDelegate } from 'generated'
import { useRomulusDelegateContract } from 'hooks/useContract'
import { useMemo } from 'react'
import { useSingleCallResult } from 'state/multicall/hooks'

interface RomulusInfo {
  romulus: RomulusDelegate | undefined
  releaseTokenAddress: Address | undefined
  tokenAddress: Address | undefined
}

export const useRomulusInfo = (romulusAddress: Address | undefined): RomulusInfo => {
  const romulusContract = useRomulusDelegateContract(romulusAddress)
  const releaseTokenAddress = useSingleCallResult(romulusContract, 'releaseToken', []).result?.[0]
  const tokenAddress = useSingleCallResult(romulusContract, 'token', []).result?.[0]
  return useMemo(() => {
    return {
      romulus: romulusContract ?? undefined,
      releaseTokenAddress,
      tokenAddress,
    }
  }, [romulusContract, releaseTokenAddress, tokenAddress])
}

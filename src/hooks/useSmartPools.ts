import { BigNumber } from '@ethersproject/bignumber'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { useMemo } from 'react'
// TODO: remove duplicate method definition and reorg code
import { usePoolExtendedContract } from 'state/pool/hooks'

interface PoolInitParams {
  name: string
  symbol: string
  decimals: number
  owner: string
  baseToken: string
}

interface PoolVariables {
  minPeriod: BigNumber
  spread: number
  transactionFee: number
  feeCollector: string
  kycProvider: string
}

interface PoolTokensInfo {
  unitaryValue: BigNumber
  totalSupply: BigNumber
}
// only value we are missing here is pool Id
interface PoolDetails {
  poolInitParams: PoolInitParams
  poolVariables: PoolVariables
  poolTokensInfo: PoolTokensInfo
}

export interface UserAccount {
  userBalance: BigNumber
  activation: BigNumber
}

export function useSmartPoolFromAddress(poolAddress: string | undefined): PoolDetails | undefined {
  const poolExtendedContract = usePoolExtendedContract(poolAddress)
  // we return entire "poolStorage", i.e. poolInitParams, poolVariables, poolTokensInfo
  //const result: PoolDetails[] | undefined = useSingleCallResult(poolExtendedContract, 'getPoolStorage')
  const { result } = useSingleCallResult(poolExtendedContract ?? undefined, 'getPoolStorage')

  return useMemo(() => {
    const poolStorage: PoolDetails | undefined = {
      poolInitParams: result?.[0],
      poolVariables: result?.[1],
      poolTokensInfo: result?.[2],
    }

    return poolStorage ?? undefined
  }, [result])
}

export function useUserPoolBalance(
  poolAddress: string | undefined,
  account: string | undefined
): UserAccount | undefined {
  const poolExtendedContract = usePoolExtendedContract(poolAddress)
  // we return entire "poolStorage", i.e. poolInitParams, poolVariables, poolTokensInfo
  //const result: PoolDetails[] | undefined = useSingleCallResult(poolExtendedContract, 'getPoolStorage')
  const target = useMemo(() => [account ?? undefined], [account])
  const { result } = useSingleCallResult(poolExtendedContract ?? undefined, 'getUserAccount', target)

  return useMemo(() => {
    if (!poolExtendedContract) return undefined

    return result?.[0]
  }, [poolExtendedContract, result])
}

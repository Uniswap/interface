import { useSingleCallResult, useSingleContractMultipleData } from 'state/multicall/hooks'
import { useMemo } from 'react'
import { PositionDetails } from 'types/position'
import { useV3NFTPositionManagerContract } from './useContract'
import JSBI from 'jsbi'

interface UseV3PositionsResults {
  error?: (string | boolean) | (string | boolean)[]
  loading: boolean
  positions: PositionDetails[] | undefined
}
export function useV3Positions(account: string | null | undefined): UseV3PositionsResults {
  const positionManager = useV3NFTPositionManagerContract()

  const { loading: balanceLoading, error: balanceError, result: balanceResult } = useSingleCallResult(
    positionManager ?? undefined,
    'balanceOf',
    [account ?? undefined]
  )

  const accountBalance: number | undefined = balanceResult
    ? parseFloat(JSBI.BigInt(balanceResult[0]).toString())
    : undefined

  const positionIndicesArgs = useMemo(() => {
    if (accountBalance && account) {
      const tokenRequests = []
      for (let i = 0; i < accountBalance; i++) {
        tokenRequests.push([account, i])
      }
      return tokenRequests
    }
    return []
  }, [account, accountBalance])

  const positionIndicesResults = useSingleContractMultipleData(
    positionManager ?? undefined,
    'tokenOfOwnerByIndex',
    positionIndicesArgs
  )
  const positionIndicesLoading = useMemo(() => positionIndicesResults.some(({ loading }) => loading), [
    positionIndicesResults,
  ])
  const positionIndicesError = useMemo(() => positionIndicesResults.some(({ error }) => error), [
    positionIndicesResults,
  ])

  const formattedIndicesArgs = useMemo(() => {
    if (positionIndicesResults && account) {
      return positionIndicesResults.map((call) => {
        return [call.result?.[0] ? parseFloat(JSBI.BigInt(call.result?.[0]).toString()) : undefined]
      })
    }
    return []
  }, [account, positionIndicesResults])

  const positionsResults = useSingleContractMultipleData(
    positionManager ?? undefined,
    'positions',
    formattedIndicesArgs
  )
  const positionResultsLoading = useMemo(() => positionsResults.some(({ loading }) => loading), [positionsResults])
  const positionResultsError = useMemo(() => positionsResults.some(({ error }) => error), [positionsResults])

  const loading = balanceLoading || positionResultsLoading || positionIndicesLoading

  const positions = useMemo(() => {
    if (positionsResults && !loading) {
      return positionsResults.map((entry) => {
        const rp = entry.result
        return {
          fee: rp?.fee,
          feeGrowthInside0LastX128: rp?.feeGrowthInside0LastX128,
          feeGrowthInside1LastX128: rp?.feeGrowthInside1LastX128,
          liquidity: rp?.liquidity,
          nonce: rp?.nonce,
          operator: rp?.operator,
          tickLower: rp?.tickLower,
          tickUpper: rp?.tickUpper,
          token0: rp?.token0,
          token1: rp?.token1,
          tokensOwed0: rp?.tokensOwed0,
          tokensOwed1: rp?.tokensOwed1,
        }
      })
    }
    return undefined
  }, [positionsResults, loading])

  return {
    error: balanceError || positionIndicesError || positionResultsError,
    loading,
    positions,
  }
}

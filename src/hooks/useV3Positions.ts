import { useSingleCallResult, useSingleContractMultipleData, Result } from 'state/multicall/hooks'
import { useMemo } from 'react'
import { PositionDetails } from 'types/position'
import { useV3NFTPositionManagerContract } from './useContract'
import { BigNumber } from '@ethersproject/bignumber'

interface UseV3PositionsResults {
  loading: boolean
  error: boolean
  positions: (PositionDetails & { tokenId: BigNumber })[] | undefined
}

function useV3PositionsFromTokenIds(tokenIds: BigNumber[]): UseV3PositionsResults {
  const positionManager = useV3NFTPositionManagerContract()
  const inputs = useMemo(() => tokenIds.map((tokenId) => [tokenId]), [tokenIds])
  const results = useSingleContractMultipleData(positionManager ?? undefined, 'positions', inputs)

  const loading = useMemo(() => results.some(({ loading }) => loading), [results])
  const error = useMemo(() => results.some(({ error }) => error), [results])

  const positions = useMemo(() => {
    if (!loading && !error) {
      return results.map((call) => {
        const result = call.result as Result
        return {
          fee: result.fee,
          feeGrowthInside0LastX128: result.feeGrowthInside0LastX128,
          feeGrowthInside1LastX128: result.feeGrowthInside1LastX128,
          liquidity: result.liquidity,
          nonce: result.nonce,
          operator: result.operator,
          tickLower: result.tickLower,
          tickUpper: result.tickUpper,
          token0: result.token0,
          token1: result.token1,
          tokensOwed0: result.tokensOwed0,
          tokensOwed1: result.tokensOwed1,
        }
      })
    }
    return undefined
  }, [loading, error, results])

  return {
    loading,
    error,
    positions: positions?.map((position, i) => ({ ...position, tokenId: inputs[i][0] })),
  }
}

interface UseV3PositionResults {
  loading: boolean
  error: boolean
  position: (PositionDetails & { tokenId: BigNumber }) | undefined
}

export function useV3PositionFromTokenId(tokenId: BigNumber): UseV3PositionResults {
  const position = useV3PositionsFromTokenIds([tokenId])
  return {
    loading: position.loading,
    error: position.error,
    position: position.positions?.[0],
  }
}

export function useV3Positions(account: string | null | undefined): UseV3PositionsResults {
  const positionManager = useV3NFTPositionManagerContract()

  const { loading: balanceLoading, error: balanceError, result: balanceResult } = useSingleCallResult(
    positionManager ?? undefined,
    'balanceOf',
    [account ?? undefined]
  )

  // we don't expect any account balance to ever exceed the bounds of max safe int
  const accountBalance: number | undefined = balanceResult?.[0] ? Number.parseInt(balanceResult[0]) : undefined

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

  const tokenIds = useMemo(() => {
    if (account) {
      return positionIndicesResults
        .map(({ result }) => result)
        .filter((result): result is Result => !!result)
        .map((result) => BigNumber.from(result[0]))
    }
    return []
  }, [account, positionIndicesResults])

  const positionsResults = useV3PositionsFromTokenIds(tokenIds)

  // wrap the return value
  const loading = balanceLoading || positionIndicesLoading
  const error = balanceError || positionIndicesError

  return {
    loading: loading || positionsResults.loading,
    error: error || positionsResults.error,
    positions: loading || error ? undefined : positionsResults.positions,
  }
}

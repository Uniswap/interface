import { OptionalMethodInputs, useSingleCallResult, useSingleContractMultipleData } from 'state/multicall/hooks'
import { Position } from 'types/v3'
import { useV3NFTPositionManagerContract } from './useContract'

interface UseV3PositionsResults {
  error?: (string | boolean) | (string | boolean)[]
  loading: boolean
  positions: Position[]
}
export function useV3Positions(account: string | null | undefined): UseV3PositionsResults {
  const positionManager = useV3NFTPositionManagerContract()
  let loading = false
  let error: any
  const {
    error: balanceOfError,
    loading: balanceOfLoading,
    result: balanceOfResult,
  } = useSingleCallResult(positionManager, 'balanceOf', [account || undefined])

  loading = balanceOfLoading
  error = balanceOfError

  const tokenOfOwnerByIndexArgs: OptionalMethodInputs[] = balanceOfResult
    ? balanceOfResult.filter((x) => Boolean(x)).map((index) => [account, index])
    : []
  const tokensCallResults = useSingleContractMultipleData(
    positionManager,
    'tokenOfOwnerByIndex',
    tokenOfOwnerByIndexArgs
  )

  const callData: any[] = []
  tokensCallResults.forEach(({ error: e, loading: l, result: data }) => {
    if (e && !error) {
      error = e
    }
    loading = loading || l
    if (data) {
      callData.push([account, data])
    }
  })

  const positionsCallResults = useSingleContractMultipleData(positionManager, 'positions', callData)

  const positions: any[] = []
  positionsCallResults.forEach(({ error: e, loading: l, result: data }) => {
    if (e) {
      if (!error) {
        error = e
      }
      if (error && Array.isArray(error)) {
        error = [...error, error]
      }
    }
    loading = loading || l

    if (data) {
      positions.push(data)
    }
  })

  return { error, loading, positions }
}

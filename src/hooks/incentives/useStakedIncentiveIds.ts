import { BigNumber } from 'ethers'
import { useV3Staker } from 'hooks/useContract'
import { useMemo } from 'react'
import { useSingleContractMultipleData } from 'state/multicall/hooks'
import { Incentive } from './useAllIncentives'

// for list of token ids, include list of incentives and current staking status
export interface TokenIncentiveMap {
  [tokenId: string]: {
    [incentiveId: string]: {
      liquidity: BigNumber | undefined
      secondsPerLiquidityInsideInitialX128: BigNumber | undefined
    }
  }
}

/**
 *
 * @param tokenIds - ids to check for
 * @param incentives - all incentive ids to check for each token id -
 * ^^ keep as param if ever want to check for subset of incentives
 * @returns map of tokenid -> stake incentive id []
 */
export default function useStakesForPosition(
  tokenIds: BigNumber[] | undefined,
  incentives: Incentive[] | undefined
): {
  loading: boolean
  tokenIncentiveMap: TokenIncentiveMap | null
} {
  const staker = useV3Staker()

  const incentiveIds = useMemo(() => (incentives ? incentives.map((i) => i.id) : undefined), [incentives])

  const args = useMemo(() => {
    if (tokenIds && incentiveIds) {
      return tokenIds.reduce((accum: (BigNumber | string)[][], tokenId) => {
        return [...accum, ...incentiveIds.map((incentiveId) => [tokenId, incentiveId])]
      }, [])
    }
    return []
  }, [incentiveIds, tokenIds])

  const results = useSingleContractMultipleData(staker, 'stakes', args)

  const tokenIncentiveMap = useMemo(() => {
    if (!tokenIds || !incentiveIds) {
      return undefined
    }

    // for each position, get the status of its stake in each incentive
    let index = 0
    return tokenIds?.reduce((accum: TokenIncentiveMap, tokenId) => {
      incentiveIds?.map((incentiveId) => {
        const liquidity = results[index].result?.[0]
        const secondsPerLiquidityInsideInitialX128 = results[index].result?.[1]
        // only track status if valid returned values from call
        if (Boolean(liquidity && secondsPerLiquidityInsideInitialX128)) {
          accum[tokenId.toString()] = {
            ...accum[tokenId.toString()],
            [incentiveId]: {
              liquidity,
              secondsPerLiquidityInsideInitialX128,
            },
          }
        }
      })
      index++
      return accum
    }, {})
  }, [incentiveIds, results, tokenIds])

  if (!tokenIncentiveMap) {
    return {
      loading: true,
      tokenIncentiveMap: null,
    }
  }

  return {
    loading: false,
    tokenIncentiveMap,
  }
}

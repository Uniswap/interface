import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { defaultAbiCoder, keccak256, Result } from 'ethers/lib/utils'
import { useMemo } from 'react'
import { useLogs } from '../../state/logs/hooks'
import { useSingleContractMultipleData } from '../../state/multicall/hooks'
import { useAllTokens } from '../Tokens'
import { useV3Staker } from '../useContract'

export interface Incentive {
  pool: string
  startTime: number
  endTime: number
  initialRewardAmount: CurrencyAmount<Token>
  rewardAmountRemaining: CurrencyAmount<Token>
  rewardRatePerSecond: CurrencyAmount<Token>
}

// TODO: check this encoding matches the abi encoding of the tuple
function incentiveKeyToIncentiveId(log: Result): string {
  return keccak256(
    defaultAbiCoder.encode(
      ['address', 'address', 'uint256', 'uint256', 'address'],
      [log.rewardToken, log.pool, log.startTime, log.endTime, log.refundee]
    )
  )
}

export function useAllIncentives(): {
  loading: boolean
  incentives?: Incentive[]
} {
  const staker = useV3Staker()
  const filter = useMemo(() => staker?.filters?.IncentiveCreated(), [staker])
  const { logs } = useLogs(filter)

  const parsedLogs = useMemo(() => {
    if (!staker) return undefined
    const fragment = staker.interface.events['IncentiveCreated(address,address,uint256,uint256,address,uint256)']
    return logs?.map((logs) => staker.interface.decodeEventLog(fragment, logs.data, logs.topics))
  }, [logs, staker])

  const incentiveIds = useMemo(() => {
    return parsedLogs?.map((log) => [incentiveKeyToIncentiveId(log)]) ?? []
  }, [parsedLogs])

  const incentiveStates = useSingleContractMultipleData(staker, 'incentives', incentiveIds)

  // returns all the token addresses for which there are incentives
  // const tokenAddresses = useMemo(() => {
  //   return Object.keys(
  //     parsedLogs?.reduce<{ [tokenAddress: string]: true }>((memo, value) => {
  //       memo[value.rewardToken] = true
  //       return memo
  //     }, {}) ?? {}
  //   )
  // }, [parsedLogs])

  /**
   *
   *  @TODO
   *
   *  fetch pool data with a usePools or something for each incentive
   *
   */

  // todo: get the tokens not in the active token lists
  const allTokens = useAllTokens()

  return useMemo(() => {
    if (!parsedLogs || incentiveStates.some((s) => s.loading)) return { loading: true }

    return {
      loading: false,
      incentives: parsedLogs
        .map((result, ix): Incentive | null => {
          const token = allTokens[result.rewardToken]
          const state = incentiveStates[ix]?.result
          // todo: currently we filter any icnentives for tokens not on the active token lists
          if (!token || !state) return null

          const initialRewardAmount = CurrencyAmount.fromRawAmount(token, result.reward.toString())
          const rewardAmountRemaining = CurrencyAmount.fromRawAmount(token, state.totalRewardUnclaimed.toString())

          const [startTime, endTime] = [result.startTime.toNumber(), result.endTime.toNumber()]

          const rewardRatePerSecond = initialRewardAmount.divide(endTime - startTime)

          return {
            pool: result.pool,
            startTime,
            endTime,
            initialRewardAmount,
            rewardAmountRemaining,
            rewardRatePerSecond,
          }
        })
        .filter((x): x is Incentive => x !== null),
    }
  }, [allTokens, incentiveStates, parsedLogs])
}

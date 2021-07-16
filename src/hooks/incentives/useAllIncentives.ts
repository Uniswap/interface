import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { defaultAbiCoder, Result, keccak256 } from 'ethers/lib/utils'
import { useMemo } from 'react'
import { LogsState, useLogs } from '../../state/logs/hooks'
import { useSingleContractMultipleData } from '../../state/multicall/hooks'
import { useAllTokens } from '../Tokens'
import { useV3Staker } from '../useContract'

interface Incentive {
  pool: string
  startTime: number
  endTime: number
  refundee: string
  initialRewardAmount: CurrencyAmount<Token>
  rewardAmountRemaining: CurrencyAmount<Token>
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
  state: LogsState
  incentives?: Incentive[]
} {
  const staker = useV3Staker()
  const filter = useMemo(() => staker?.filters?.IncentiveCreated(), [staker])
  const { logs, state } = useLogs(filter)

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

  // todo: get the tokens not in the active token lists
  const allTokens = useAllTokens()

  return useMemo(() => {
    if (!parsedLogs) return { state }

    return {
      state,
      incentives: parsedLogs
        ?.map((result, ix): Incentive | null => {
          const token = allTokens[result.rewardToken]
          const state = incentiveStates[ix]?.result
          // todo: currently we filter any icnentives for tokens not on the active token lists
          if (!token || !state) return null

          return {
            pool: result.pool,
            startTime: result.startTime.toNumber(),
            endTime: result.endTime.toNumber(),
            refundee: result.refundee,
            initialRewardAmount: CurrencyAmount.fromRawAmount(token, result.reward.toString()),
            rewardAmountRemaining: CurrencyAmount.fromRawAmount(token, state.totalRewardUnclaimed.toString()),
          }
        })
        ?.filter((x): x is Incentive => x !== null),
    }
  }, [allTokens, incentiveStates, parsedLogs, state])
}

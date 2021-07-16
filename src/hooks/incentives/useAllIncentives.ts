import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { LogsState, useLogs } from '../../state/logs/hooks'
import { useAllTokens } from '../Tokens'
import { useV3Staker } from '../useContract'

interface Incentive {
  pool: string
  startTime: number
  endTime: number
  refundee: string
  rewardAmount: CurrencyAmount<Token>
}

export function useAllIncentives(): {
  state: LogsState
  incentives?: Incentive[]
} {
  const staker = useV3Staker()
  const { logs, state } = useLogs(staker?.filters?.IncentiveCreated())

  const parsedLogs = useMemo(() => {
    if (!staker) return undefined
    const fragment = staker.interface.events['IncentiveCreated(address,address,uint256,uint256,address,uint256)']
    return logs?.map((logs) => staker.interface.decodeEventLog(fragment, logs.data))
  }, [logs, staker])

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
        ?.filter((result) => Boolean(allTokens[result.rewardToken]))
        ?.map((result) => ({
          pool: result.pool,
          startTime: result.startTime.toNumber(),
          endTime: result.endTime.toNumber(),
          refundee: result.refundee,
          rewardAmount: CurrencyAmount.fromRawAmount(allTokens[result.rewardToken], result.reward.toString()),
        })),
    }
  }, [allTokens, parsedLogs, state])
}

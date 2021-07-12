import { useMemo } from 'react'
import { LogsState, useLogs } from '../state/logs/hooks'
import { useV3Staker } from './useContract'
import { useActiveWeb3React } from './web3'

const VALID_STATES: LogsState[] = [LogsState.SYNCING, LogsState.SYNCED]

export function useDepositedTokenIds() {
  const v3Staker = useV3Staker()
  const { account } = useActiveWeb3React()
  const filters = useMemo(() => {
    if (!v3Staker) return []
    return [
      v3Staker.filters.DepositTransferred(null, account, null),
      v3Staker.filters.DepositTransferred(null, null, account),
    ]
  }, [account, v3Staker])

  const transferredFromLogs = useLogs(filters[0])
  const transferredToLogs = useLogs(filters[1])

  const deposited = useMemo(() => {
    if (!VALID_STATES.includes(transferredFromLogs.state) || !VALID_STATES.includes(transferredToLogs.state))
      return undefined

    // todo: sort this concatenated list by block number and then transaction index and then log index
    return (transferredFromLogs.logs ?? []).concat(transferredToLogs.logs ?? [])
  }, [transferredFromLogs.logs, transferredFromLogs.state, transferredToLogs])

  console.log(deposited)

  throw new Error('todo')
}

import { useMemo } from 'react'
import { useLogs, LogsState } from '../state/logs/hooks'
import { useV3Staker } from './useContract'
import { useActiveWeb3React } from './web3'

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
    if (transferredFromLogs.state !== LogsState.SYNCED || transferredToLogs !== LogsState.SYNCED) return undefined
    // todo: sort this concatenated list by block number and then transaction index and then log index
    return (transferredFromLogs.logs ?? []).concat(transferredToLogs.logs ?? [])
  }, [transferredFromLogs.logs, transferredFromLogs.state, transferredToLogs])

  console.log(deposited)

  throw new Error('todo')
}

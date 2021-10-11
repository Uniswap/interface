import { useEffect, useMemo } from 'react'

import { useActiveWeb3React } from '../../hooks/web3'
import { useBlockNumber } from '../application/hooks'
import { useAppDispatch, useAppSelector } from '../hooks'
import { fetchedLogs, fetchedLogsError, fetchingLogs } from './slice'
import { EventFilter, keyToFilter } from './utils'

export default function Updater(): null {
  const dispatch = useAppDispatch()
  const state = useAppSelector((state) => state.logs)
  const { chainId, library } = useActiveWeb3React()

  const blockNumber = useBlockNumber()

  const filtersNeedFetch: EventFilter[] = useMemo(() => {
    if (!chainId || typeof blockNumber !== 'number') return []

    const active = state[chainId]
    if (!active) return []

    return Object.keys(active)
      .filter((key) => {
        const { fetchingBlockNumber, results, listeners } = active[key]
        if (listeners === 0) return false
        if (typeof fetchingBlockNumber === 'number' && fetchingBlockNumber >= blockNumber) return false
        if (results && typeof results.blockNumber === 'number' && results.blockNumber >= blockNumber) return false
        return true
      })
      .map((key) => keyToFilter(key))
  }, [blockNumber, chainId, state])

  useEffect(() => {
    if (!library || !chainId || typeof blockNumber !== 'number' || filtersNeedFetch.length === 0) return

    dispatch(fetchingLogs({ chainId, filters: filtersNeedFetch, blockNumber }))
    filtersNeedFetch.forEach((filter) => {
      library
        .getLogs({
          ...filter,
          fromBlock: 0,
          toBlock: blockNumber,
        })
        .then((logs) => {
          dispatch(
            fetchedLogs({
              chainId,
              filter,
              results: { logs, blockNumber },
            })
          )
        })
        .catch((error) => {
          console.error('Failed to get logs', filter, error)
          dispatch(
            fetchedLogsError({
              chainId,
              filter,
              blockNumber,
            })
          )
        })
    })
  }, [blockNumber, chainId, dispatch, filtersNeedFetch, library])

  return null
}

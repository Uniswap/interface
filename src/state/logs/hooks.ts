import { retry } from '../../utils/retry'
import { useBlockNumber } from '../application/hooks'
import { EventFilter } from 'ethers'
import { useEffect, useMemo, useState } from 'react'
import { useActiveWeb3React } from '../../hooks/web3'

enum LogsState {
  // The filter is invalid
  INVALID,
  // The logs are being loaded
  LOADING,
  // Logs are from a previous block number
  SYNCING,
  // Logs have been fetched as of the latest block number
  SYNCED,
}

interface Log {
  topics: Array<string>
  data: string
}

export interface UseLogsResult {
  logs: Log[] | undefined
  state: LogsState
}

/**
 * Returns the logs for the given filter as of the latest block, re-fetching from the library every block.
 * @param filter The logs filter, without `blockHash`, `fromBlock` or `toBlock` defined.
 */
export function useLogs(
  filter: (EventFilter & { blockHash?: undefined; fromBlock?: undefined; toBlock?: undefined }) | undefined
): UseLogsResult {
  // TODO: starting off with just a hook before integrating into the store for a common layer of caching
  const { library, chainId } = useActiveWeb3React()
  const blockNumber = useBlockNumber()

  const [state, setState] = useState<{ blockNumber: number; chainId: number; logs: Log[] } | undefined>()

  useEffect(() => {
    // we do not have all the information necessary to fetch, skip
    if (!filter || !library || typeof blockNumber !== 'number' || typeof chainId !== 'number') return

    // we are already synced, skip
    if (state && state.chainId === chainId && state.blockNumber >= blockNumber) return

    // TODO: we could try to fetch only as of the last block we've seen, however there aren't good ways to force a fetch as of a block
    const { promise, cancel } = retry(() => library.getLogs({ ...filter, fromBlock: 0, toBlock: blockNumber }), {
      n: 5,
      maxWait: 1000,
      minWait: 2500,
    })

    promise
      .then((logs) => {
        setState((prev) => {
          if (prev && prev.chainId === chainId && prev.blockNumber > blockNumber) return prev

          return {
            blockNumber,
            chainId,
            logs,
          }
        })
      })
      .catch((error) => {
        if (error.isCancelledError) return

        console.error('Failed to fetch logs', error)
        setState(undefined)
      })

    return cancel
  }, [library, chainId, filter, blockNumber, state])

  return useMemo(() => {
    if (!filter || !library || typeof chainId !== 'number' || typeof blockNumber !== 'number') {
      return {
        state: LogsState.INVALID,
        logs: undefined,
      }
    }

    if (!state || state.chainId !== chainId) {
      return {
        state: LogsState.LOADING,
        logs: undefined,
      }
    }

    return {
      state: state.blockNumber >= blockNumber ? LogsState.SYNCED : LogsState.SYNCING,
      logs: state.logs,
    }
  }, [blockNumber, chainId, filter, library, state])
}

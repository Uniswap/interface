import { useEffect, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Multicall2 } from '../../abis/types'
import { useActiveWeb3React } from '../../hooks'
import { useMulticall2Contract } from '../../hooks/useContract'
import useDebounce from '../../hooks/useDebounce'
import chunkArray from '../../utils/chunkArray'
import { CancelledError, retry, RetryableError } from '../../utils/retry'
import { useBlockNumber } from '../application/hooks'
import { AppDispatch, AppState } from '../index'
import {
  Call,
  errorFetchingMulticallResults,
  fetchingMulticallResults,
  parseCallKey,
  updateMulticallResults,
} from './actions'

/**
 * Fetches a chunk of calls, enforcing a minimum block number constraint
 * @param multicall2Contract multicall contract to fetch against
 * @param chunk chunk of calls to make
 * @param minBlockNumber minimum block number of the result set
 */
async function fetchChunk(
  multicall2Contract: Multicall2,
  chunk: Call[],
  minBlockNumber: number
): Promise<{
  results: { success: boolean; returnData: string }[]
  blockNumber: number
}> {
  console.debug('Fetching chunk', chunk, minBlockNumber)
  let resultsBlockNumber: number
  let results: { success: boolean; returnData: string }[]
  try {
    const { blockNumber, returnData } = await multicall2Contract.callStatic.tryBlockAndAggregate(
      false,
      chunk.map((obj) => ({ target: obj.address, callData: obj.callData }))
    )
    resultsBlockNumber = blockNumber.toNumber()
    results = returnData
  } catch (error) {
    console.debug('Failed to fetch chunk', error)
    throw error
  }
  if (resultsBlockNumber < minBlockNumber) {
    console.debug(`Fetched results for old block number: ${resultsBlockNumber.toString()} vs. ${minBlockNumber}`)
    throw new RetryableError('Fetched for old block number')
  }
  return { results, blockNumber: resultsBlockNumber }
}

/**
 * From the current all listeners state, return each call key mapped to the
 * minimum number of blocks per fetch. This is how often each key must be fetched.
 * @param allListeners the all listeners state
 * @param chainId the current chain id
 */
export function activeListeningKeys(
  allListeners: AppState['multicall']['callListeners'],
  chainId?: number
): { [callKey: string]: number } {
  if (!allListeners || !chainId) return {}
  const listeners = allListeners[chainId]
  if (!listeners) return {}

  return Object.keys(listeners).reduce<{ [callKey: string]: number }>((memo, callKey) => {
    const keyListeners = listeners[callKey]

    memo[callKey] = Object.keys(keyListeners)
      .filter((key) => {
        const blocksPerFetch = parseInt(key)
        if (blocksPerFetch <= 0) return false
        return keyListeners[blocksPerFetch] > 0
      })
      .reduce((previousMin, current) => {
        return Math.min(previousMin, parseInt(current))
      }, Infinity)
    return memo
  }, {})
}

/**
 * Return the keys that need to be refetched
 * @param callResults current call result state
 * @param listeningKeys each call key mapped to how old the data can be in blocks
 * @param chainId the current chain id
 * @param latestBlockNumber the latest block number
 */
export function outdatedListeningKeys(
  callResults: AppState['multicall']['callResults'],
  listeningKeys: { [callKey: string]: number },
  chainId: number | undefined,
  latestBlockNumber: number | undefined
): string[] {
  if (!chainId || !latestBlockNumber) return []
  const results = callResults[chainId]
  // no results at all, load everything
  if (!results) return Object.keys(listeningKeys)

  return Object.keys(listeningKeys).filter((callKey) => {
    const blocksPerFetch = listeningKeys[callKey]

    const data = callResults[chainId][callKey]
    // no data, must fetch
    if (!data) return true

    const minDataBlockNumber = latestBlockNumber - (blocksPerFetch - 1)

    // already fetching it for a recent enough block, don't refetch it
    if (data.fetchingBlockNumber && data.fetchingBlockNumber >= minDataBlockNumber) return false

    // if data is older than minDataBlockNumber, fetch it
    return !data.blockNumber || data.blockNumber < minDataBlockNumber
  })
}

export default function Updater(): null {
  const dispatch = useDispatch<AppDispatch>()
  const state = useSelector<AppState, AppState['multicall']>((state) => state.multicall)
  // wait for listeners to settle before triggering updates
  const debouncedListeners = useDebounce(state.callListeners, 100)
  const latestBlockNumber = useBlockNumber()
  const { chainId } = useActiveWeb3React()
  const multicall2Contract = useMulticall2Contract()
  const cancellations = useRef<{ blockNumber: number; cancellations: (() => void)[] }>()

  const listeningKeys: { [callKey: string]: number } = useMemo(() => {
    return activeListeningKeys(debouncedListeners, chainId)
  }, [debouncedListeners, chainId])

  const unserializedOutdatedCallKeys = useMemo(() => {
    return outdatedListeningKeys(state.callResults, listeningKeys, chainId, latestBlockNumber)
  }, [chainId, state.callResults, listeningKeys, latestBlockNumber])

  const serializedOutdatedCallKeys = useMemo(() => JSON.stringify(unserializedOutdatedCallKeys.sort()), [
    unserializedOutdatedCallKeys,
  ])

  useEffect(() => {
    if (!latestBlockNumber || !chainId || !multicall2Contract) return

    const outdatedCallKeys: string[] = JSON.parse(serializedOutdatedCallKeys)
    if (outdatedCallKeys.length === 0) return
    const calls = outdatedCallKeys.map((key) => parseCallKey(key))

    const chunkedCalls = chunkArray(calls)

    if (cancellations.current?.blockNumber !== latestBlockNumber) {
      cancellations.current?.cancellations?.forEach((c) => c())
    }

    dispatch(
      fetchingMulticallResults({
        calls,
        chainId,
        fetchingBlockNumber: latestBlockNumber,
      })
    )

    cancellations.current = {
      blockNumber: latestBlockNumber,
      cancellations: chunkedCalls.map((chunk, index) => {
        const { cancel, promise } = retry(() => fetchChunk(multicall2Contract, chunk, latestBlockNumber), {
          n: Infinity,
          minWait: 2500,
          maxWait: 3500,
        })
        promise
          .then(({ results: returnData, blockNumber: fetchBlockNumber }) => {
            cancellations.current = { cancellations: [], blockNumber: latestBlockNumber }

            // accumulates the length of all previous indices
            const firstCallKeyIndex = chunkedCalls.slice(0, index).reduce<number>((memo, curr) => memo + curr.length, 0)
            const lastCallKeyIndex = firstCallKeyIndex + returnData.length

            const slice = outdatedCallKeys.slice(firstCallKeyIndex, lastCallKeyIndex)

            // split the returned slice into errors and success
            const { erroredCalls, results } = slice.reduce<{
              erroredCalls: Call[]
              results: { [callKey: string]: string | null }
            }>(
              (memo, callKey, i) => {
                if (returnData[i].success) {
                  memo.results[callKey] = returnData[i].returnData ?? null
                } else {
                  memo.erroredCalls.push(parseCallKey(callKey))
                }
                return memo
              },
              { erroredCalls: [], results: {} }
            )

            // dispatch any new results
            if (Object.keys(results).length > 0)
              dispatch(
                updateMulticallResults({
                  chainId,
                  results,
                  blockNumber: fetchBlockNumber,
                })
              )

            // dispatch any errored calls
            if (erroredCalls.length > 0) {
              console.debug('Calls errored in fetch', erroredCalls)
              dispatch(
                errorFetchingMulticallResults({
                  calls: erroredCalls,
                  chainId,
                  fetchingBlockNumber: fetchBlockNumber,
                })
              )
            }
          })
          .catch((error: any) => {
            if (error instanceof CancelledError) {
              console.debug('Cancelled fetch for blockNumber', latestBlockNumber)
              return
            }
            console.error('Failed to fetch multicall chunk', chunk, chainId, error)
            dispatch(
              errorFetchingMulticallResults({
                calls: chunk,
                chainId,
                fetchingBlockNumber: latestBlockNumber,
              })
            )
          })
        return cancel
      }),
    }
  }, [chainId, multicall2Contract, dispatch, serializedOutdatedCallKeys, latestBlockNumber])

  return null
}

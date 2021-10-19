import { useEffect, useMemo, useRef } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { UniswapInterfaceMulticall } from 'types/v3'

import { useMulticall2Contract } from '../../hooks/useContract'
import useDebounce from '../../hooks/useDebounce'
import { useActiveWeb3React } from '../../hooks/web3'
import chunkArray from '../../utils/chunkArray'
import { retry, RetryableError } from '../../utils/retry'
import { useBlockNumber } from '../application/hooks'
import { AppState } from '../index'
import { errorFetchingMulticallResults, fetchingMulticallResults, updateMulticallResults } from './actions'
import { Call, parseCallKey, toCallKey } from './utils'

const DEFAULT_CALL_GAS_REQUIRED = 1_000_000

/**
 * Fetches a chunk of calls, enforcing a minimum block number constraint
 * @param multicall multicall contract to fetch against
 * @param chunk chunk of calls to make
 * @param blockNumber block number passed as the block tag in the eth_call
 */
async function fetchChunk(
  multicall: UniswapInterfaceMulticall,
  chunk: Call[],
  blockNumber: number
): Promise<{ success: boolean; returnData: string }[]> {
  console.debug('Fetching chunk', chunk, blockNumber)
  try {
    const { returnData } = await multicall.callStatic.multicall(
      chunk.map((obj) => ({
        target: obj.address,
        callData: obj.callData,
        gasLimit: obj.gasRequired ?? DEFAULT_CALL_GAS_REQUIRED,
      })),
      {
        // we aren't passing through the block gas limit we used to create the chunk, because it causes a problem with the integ tests
        blockTag: blockNumber,
      }
    )

    if (process.env.NODE_ENV === 'development') {
      returnData.forEach(({ gasUsed, returnData, success }, i) => {
        if (
          !success &&
          returnData.length === 2 &&
          gasUsed.gte(Math.floor((chunk[i].gasRequired ?? DEFAULT_CALL_GAS_REQUIRED) * 0.95))
        ) {
          console.warn(
            `A call failed due to requiring ${gasUsed.toString()} vs. allowed ${
              chunk[i].gasRequired ?? DEFAULT_CALL_GAS_REQUIRED
            }`,
            chunk[i]
          )
        }
      })
    }

    return returnData
  } catch (error) {
    if (error.code === -32000 || error.message?.indexOf('header not found') !== -1) {
      throw new RetryableError(`header not found for block number ${blockNumber}`)
    } else if (error.code === -32603 || error.message?.indexOf('execution ran out of gas') !== -1) {
      if (chunk.length > 1) {
        if (process.env.NODE_ENV === 'development') {
          console.debug('Splitting a chunk in 2', chunk)
        }
        const half = Math.floor(chunk.length / 2)
        const [c0, c1] = await Promise.all([
          fetchChunk(multicall, chunk.slice(0, half), blockNumber),
          fetchChunk(multicall, chunk.slice(half, chunk.length), blockNumber),
        ])
        return c0.concat(c1)
      }
    }
    console.error('Failed to fetch chunk', error)
    throw error
  }
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
  const dispatch = useAppDispatch()
  const state = useAppSelector((state) => state.multicall)
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

  const serializedOutdatedCallKeys = useMemo(
    () => JSON.stringify(unserializedOutdatedCallKeys.sort()),
    [unserializedOutdatedCallKeys]
  )

  // todo: consider getting this information from the node we are using, e.g. block.gaslimit
  const chunkGasLimit = 100_000_000

  useEffect(() => {
    if (!latestBlockNumber || !chainId || !multicall2Contract) return

    const outdatedCallKeys: string[] = JSON.parse(serializedOutdatedCallKeys)
    if (outdatedCallKeys.length === 0) return
    const calls = outdatedCallKeys.map((key) => parseCallKey(key))

    const chunkedCalls = chunkArray(calls, chunkGasLimit)

    if (cancellations.current && cancellations.current.blockNumber !== latestBlockNumber) {
      cancellations.current.cancellations.forEach((c) => c())
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
      cancellations: chunkedCalls.map((chunk) => {
        const { cancel, promise } = retry(() => fetchChunk(multicall2Contract, chunk, latestBlockNumber), {
          n: Infinity,
          minWait: 1000,
          maxWait: 2500,
        })
        promise
          .then((returnData) => {
            // split the returned slice into errors and results
            const { erroredCalls, results } = chunk.reduce<{
              erroredCalls: Call[]
              results: { [callKey: string]: string | null }
            }>(
              (memo, call, i) => {
                if (returnData[i].success) {
                  memo.results[toCallKey(call)] = returnData[i].returnData ?? null
                } else {
                  memo.erroredCalls.push(call)
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
                  blockNumber: latestBlockNumber,
                })
              )

            // dispatch any errored calls
            if (erroredCalls.length > 0) {
              if (process.env.NODE_ENV === 'development') {
                returnData.forEach((returnData, ix) => {
                  if (!returnData.success) {
                    console.debug('Call failed', chunk[ix], returnData)
                  }
                })
              } else {
                console.debug('Calls errored in fetch', erroredCalls)
              }
              dispatch(
                errorFetchingMulticallResults({
                  calls: erroredCalls,
                  chainId,
                  fetchingBlockNumber: latestBlockNumber,
                })
              )
            }
          })
          .catch((error: any) => {
            if (error.isCancelledError) {
              console.debug('Cancelled fetch for blockNumber', latestBlockNumber, chunk, chainId)
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
